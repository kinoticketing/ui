// src/routes/api/user/reservations/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
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

export const GET: RequestHandler = async ({ locals }) => {
	const client = await pool.connect();
	try {
		const session = await locals.getSession();
		if (!session?.user?.id) {
			return new Response('Unauthorized', { status: 401 });
		}

		const result = await client.query(
			`
            SELECT 
                t.id,
                t.ticket_code,
                t.status,
                t.price,
                t.created_at as booking_date,
                m.title as movie_title,
                s.start_time as screening_time,
                h.name as hall_name,
                seats.seat_label
            FROM tickets t
            JOIN screenings s ON t.screening_id = s.id
            JOIN movies m ON s.movie_id = m.id
            JOIN halls h ON s.hall_id = h.id
            JOIN seats ON t.seat_id = seats.id
            WHERE t.user_id = $1
            AND t.status = 'confirmed'
            ORDER BY t.created_at DESC
        `,
			[session.user.id]
		);

		return json(result.rows);
	} catch (error) {
		console.error('Error fetching reservations:', error);
		return new Response('Internal Server Error', { status: 500 });
	} finally {
		client.release();
	}
};
