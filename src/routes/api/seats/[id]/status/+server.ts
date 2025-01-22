import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
	user: process.env.PGUSER,
	host: process.env.PGHOST,
	database: process.env.PGDATABASE,
	password: process.env.PGPASSWORD,
	port: 5432,
	ssl: {
		rejectUnauthorized: false
	}
});

export const GET: RequestHandler = async ({ params, url, locals }) => {
	const client = await pool.connect();
	try {
		const session = await locals.getSession();
		const seatId = params.id;
		const screeningId = url.searchParams.get('screeningId');

		if (!screeningId) {
			return json({ error: 'Screening ID is required' }, { status: 400 });
		}

		await client.query('BEGIN');

		// Clean up expired locks first (consistent with lock endpoint)
		await client.query(`
            DELETE FROM seat_locks 
            WHERE locked_at < NOW() - INTERVAL '5 minutes'
        `);

		// Get comprehensive seat status
		const result = await client.query(
			`
            SELECT 
                s.id as seat_id,
                CASE 
                    WHEN EXISTS (
                        SELECT 1 
                        FROM tickets t 
                        WHERE t.seat_id = s.id 
                        AND t.screening_id = $2 
                        AND t.status = 'confirmed'
                    ) OR EXISTS (
                        SELECT 1 
                        FROM seat_reservations sr 
                        WHERE sr.seat_id = s.id 
                        AND sr.screening_id = $2 
                        AND (sr.status = 'confirmed' OR (sr.status = 'pending' AND sr.created_at > NOW() - INTERVAL '5 minutes'))
                    ) THEN true
                    ELSE false
                END as is_booked,
                CASE 
                    WHEN EXISTS (
                        SELECT 1 
                        FROM seat_locks sl 
                        WHERE sl.seat_id = s.id 
                        AND sl.locked_at > NOW() - INTERVAL '5 minutes'
                    ) THEN true
                    ELSE false
                END as is_locked,
                (
                    SELECT sl.user_id 
                    FROM seat_locks sl 
                    WHERE sl.seat_id = s.id 
                    AND sl.locked_at > NOW() - INTERVAL '5 minutes'
                    LIMIT 1
                ) as locked_by,
                s.status
            FROM seats s
            WHERE s.id = $1
            `,
			[seatId, screeningId]
		);

		await client.query('COMMIT');

		if (result.rows.length === 0) {
			return json({ error: 'Seat not found' }, { status: 404 });
		}

		// Format response
		const status = result.rows[0];
		return json({
			seat_id: parseInt(status.seat_id),
			is_booked: status.is_booked,
			is_locked: status.is_locked,
			locked_by: status.locked_by,
			status: status.status,
			is_available: !status.is_booked && !status.is_locked && status.status === 'active',
			current_user: session?.user?.id || null
		});
	} catch (error) {
		await client.query('ROLLBACK');
		console.error('Error getting seat status:', error);
		return new Response('Internal Server Error', { status: 500 });
	} finally {
		client.release();
	}
};
