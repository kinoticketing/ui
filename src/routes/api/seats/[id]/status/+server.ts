// src/routes/api/seats/[id]/status/+server.ts
import { json } from '@sveltejs/kit';
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

export async function GET({ params, url }) {
	try {
		const seatId = params.id;
		const screeningId = url.searchParams.get('screeningId');

		if (!screeningId) {
			return json({ error: 'screeningId is required' }, { status: 400 });
		}

		const result = await pool.query(
			`
            WITH seat_status AS (
                SELECT 
                    seats.id as seat_id,
                    seats.seat_label,
                    seats.row_number,
                    seats.column_number,
                    seats.status,
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM tickets t 
                            WHERE t.seat_id = seats.id 
                            AND t.screening_id = $2
                            AND t.status = 'confirmed'
                        ) THEN true
                        WHEN EXISTS (
                            SELECT 1 FROM seat_reservations sr 
                            WHERE sr.seat_id = seats.id 
                            AND sr.screening_id = $2
                            AND sr.status = 'confirmed'
                        ) THEN true
                        ELSE false
                    END as is_booked,
                    EXISTS (
                        SELECT 1 FROM seat_locks sl 
                        WHERE sl.seat_id = seats.id 
                        AND sl.locked_at > NOW() - INTERVAL '15 minutes'
                        AND NOT EXISTS ( -- Exclude booked seats from being considered locked
                            SELECT 1 FROM tickets t 
                            WHERE t.seat_id = seats.id 
                            AND t.screening_id = $2
                            AND t.status = 'confirmed'
                        )
                    ) as is_locked,
                    (
                        SELECT sl.user_id 
                        FROM seat_locks sl 
                        WHERE sl.seat_id = seats.id 
                        AND sl.locked_at > NOW() - INTERVAL '15 minutes'
                        LIMIT 1
                    ) as locked_by
                FROM seats
                WHERE seats.id = $1
            )
            SELECT * FROM seat_status;
        `,
			[seatId, screeningId]
		);

		if (result.rows.length === 0) {
			return json({ error: 'Seat not found' }, { status: 404 });
		}

		return json(result.rows[0]);
	} catch (err) {
		console.error('Error fetching seat status:', err);
		return json({ error: 'Failed to fetch seat status' }, { status: 500 });
	}
}
