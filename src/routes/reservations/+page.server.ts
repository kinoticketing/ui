// src/routes/reservations/+page.server.ts
import pkg from 'pg';
const { Pool } = pkg;
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

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

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.getSession();

	// If not logged in, return empty tickets array
	if (!session?.user?.id) {
		return {
			tickets: []
		};
	}

	try {
		const query = `
            SELECT
                t.id,
                t.ticket_code,
                t.status,
                m.title AS movie_title,
                s.start_time AS screening_time,
                h.name AS hall_name,
                se.seat_label,
                CAST(t.price AS FLOAT) as price,
                t.created_at AS booking_date
            FROM
                tickets t
            JOIN screenings s ON t.screening_id = s.id
            JOIN movies m ON s.movie_id = m.imdb_id
            JOIN halls h ON s.hall_id = h.id
            JOIN seats se ON t.seat_id = se.id
            WHERE
                t.user_id = $1
                AND t.status = 'confirmed'
            ORDER BY
                t.created_at DESC
        `;

		const result = await pool.query(query, [session.user.id]);

		return {
			tickets: result.rows
		};
	} catch (e) {
		console.error('Error loading tickets:', e);
		throw error(500, 'Failed to load tickets');
	}
};
