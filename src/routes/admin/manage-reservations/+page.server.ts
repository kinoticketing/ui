import pkg from 'pg';
const { Pool } = pkg;
import type { RequestEvent } from '@sveltejs/kit';

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

export async function load() {
	try {
		const query = `
    SELECT
    t.id AS ticket_id,
    u.username,
    m.title AS movie_title,
    s.start_time,
    h.name AS hall_name,
    se.seat_label,
    t.price,
    t.status,
    t.created_at
    FROM
    tickets t
    JOIN users u ON t.user_id = u.id
    JOIN screenings s ON t.screening_id = s.id
    JOIN movies m ON s.movie_id = m.imdb_id
    JOIN halls h ON s.hall_id = h.id
    JOIN seats se ON t.seat_id = se.id
    ORDER BY
    t.created_at DESC
`;

		const result = await pool.query(query);
		return { reservations: result.rows };
	} catch (error) {
		console.error('Fehler beim Laden der Reservierungen:', error);
		return { reservations: [] };
	}
}

export const actions = {
	cancel: async ({ request }: RequestEvent) => {
		const data = await request.formData();
		const ticketId = data.get('ticketId');
		try {
			await pool.query('UPDATE tickets SET status = $1 WHERE id = $2', ['cancelled', ticketId]);
			return { success: true };
		} catch (error) {
			console.error('Fehler beim Stornieren des Tickets:', error);
			return { success: false };
		}
	}
};
