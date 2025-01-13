import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
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

export const load: PageServerLoad = async ({ params }) => {
	const ticketId = params.id;

	try {
		const query = `
            SELECT
            t.id AS ticket_id,
			t.ticket_code,
            t.price,
            t.status,
            t.created_at,
            u.username,
            u.email,
            m.title AS movie_title,
            m.duration,
            s.start_time,
            s.end_time,
            h.name AS hall_name,
            se.seat_label,
            se.row_number,
            se.column_number
            FROM
            tickets t
            JOIN users u ON t.user_id = u.id
            JOIN screenings s ON t.screening_id = s.id
            JOIN movies m ON s.movie_id = m.imdb_id
            JOIN halls h ON s.hall_id = h.id
            JOIN seats se ON t.seat_id = se.id
            WHERE
            t.id = $1
`;

		const result = await pool.query(query, [ticketId]);

		if (result.rows.length === 0) {
			throw error(404, 'Reservierung nicht gefunden');
		}

		return { reservation: result.rows[0] };
	} catch (err) {
		console.error('Fehler beim Laden der Reservierungsdetails:', err);
		throw error(500, 'Interner Serverfehler');
	}
};

export const actions = {
	cancel: async ({ params }) => {
		const ticketId = params.id;
		try {
			await pool.query('UPDATE tickets SET status = $1 WHERE id = $2', ['cancelled', ticketId]);
			return { success: true };
		} catch (err) {
			console.error('Fehler beim Stornieren des Tickets:', err);
			return { success: false };
		}
	}
};
