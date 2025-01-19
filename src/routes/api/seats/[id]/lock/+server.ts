// src/routes/api/seats/[id]/lock/+server.ts
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

export const POST: RequestHandler = async ({ request, params, locals }) => {
	const client = await pool.connect();
	try {
		const session = await locals.getSession();
		if (!session?.user?.id) {
			return new Response('Unauthorized', { status: 401 });
		}

		const { screeningId } = await request.json();
		const seatId = params.id;

		await client.query('BEGIN');

		// Clean up expired locks
		await client.query(`
            DELETE FROM seat_locks 
            WHERE locked_at < NOW() - INTERVAL '5 minutes'
        `);

		// Check if seat is already booked through tickets or reservations
		const bookingCheck = await client.query(
			`
            SELECT 1 
            FROM (
                SELECT seat_id 
                FROM tickets 
                WHERE seat_id = $1 
                AND screening_id = $2 
                AND status = 'confirmed'
                UNION
                SELECT seat_id 
                FROM seat_reservations 
                WHERE seat_id = $1 
                AND screening_id = $2 
                AND (status = 'confirmed' OR (status = 'pending' AND created_at > NOW() - INTERVAL '5 minutes'))
            ) as booked_seats
        `,
			[seatId, screeningId]
		);

		if (bookingCheck.rows.length > 0) {
			await client.query('ROLLBACK');
			return json({ error: 'Seat is already booked' }, { status: 409 });
		}

		// Check if seat is already locked by another user
		const lockCheck = await client.query(
			`
            SELECT user_id 
            FROM seat_locks 
            WHERE seat_id = $1 
            AND user_id != $2 
            AND locked_at > NOW() - INTERVAL '5 minutes'
        `,
			[seatId, session.user.id]
		);

		if (lockCheck.rows.length > 0) {
			await client.query('ROLLBACK');
			return json({ error: 'Seat is already selected by another user' }, { status: 409 });
		}

		// Upsert lock with current user
		await client.query(
			`
            INSERT INTO seat_locks (seat_id, user_id, locked_at)
            VALUES ($1, $2, CURRENT_TIMESTAMP)
            ON CONFLICT (seat_id) 
            DO UPDATE SET 
                user_id = $2,
                locked_at = CURRENT_TIMESTAMP
            WHERE seat_locks.user_id = $2
        `,
			[seatId, session.user.id]
		);

		await client.query('COMMIT');
		return json({
			success: true,
			message: 'Seat locked successfully',
			user_id: session.user.id
		});
	} catch (error) {
		await client.query('ROLLBACK');
		console.error('Error locking seat:', error);
		return new Response('Internal Server Error', { status: 500 });
	} finally {
		client.release();
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const client = await pool.connect();
	try {
		const session = await locals.getSession();
		if (!session?.user?.id) {
			return new Response('Unauthorized', { status: 401 });
		}

		const seatId = params.id;

		await client.query('BEGIN');

		// Remove lock only if it belongs to current user
		await client.query(
			`
            DELETE FROM seat_locks 
            WHERE seat_id = $1 AND user_id = $2
        `,
			[seatId, session.user.id]
		);

		await client.query('COMMIT');
		return json({
			success: true,
			message: 'Lock removed successfully'
		});
	} catch (error) {
		await client.query('ROLLBACK');
		console.error('Error unlocking seat:', error);
		return new Response('Internal Server Error', { status: 500 });
	} finally {
		client.release();
	}
};
