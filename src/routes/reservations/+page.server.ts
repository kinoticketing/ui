import pkg from 'pg';
const { Pool } = pkg;
import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

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
                t.created_at AS booking_date,
                s.end_time
            FROM
                tickets t
            JOIN screenings s ON t.screening_id = s.id
            JOIN movies m ON s.movie_id = m.imdb_id
            JOIN halls h ON s.hall_id = h.id
            JOIN seats se ON t.seat_id = se.id
            WHERE
                t.user_id = $1
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

export const actions: Actions = {
	cancel: async ({ request, locals }) => {
		const session = await locals.getSession();

		if (!session?.user?.id) {
			throw error(401, 'Unauthorized');
		}

		const formData = await request.formData();
		const ticketId = formData.get('ticketId')?.toString();

		if (!ticketId) {
			throw error(400, 'Ticket ID is required');
		}

		try {
			// First check if the ticket belongs to the user and screening hasn't started
			const checkQuery = `
                SELECT t.*, s.start_time 
                FROM tickets t
                JOIN screenings s ON t.screening_id = s.id
                WHERE t.id = $1 AND t.user_id = $2
            `;
			const checkResult = await pool.query(checkQuery, [ticketId, session.user.id]);

			if (checkResult.rows.length === 0) {
				throw error(404, 'Ticket not found');
			}

			const ticket = checkResult.rows[0];

			// Check if screening hasn't started yet
			const screeningTime = new Date(ticket.start_time);
			const now = new Date();

			if (now >= screeningTime) {
				throw error(400, 'Cannot cancel ticket - screening has already started');
			}

			// Check if ticket isn't already cancelled
			if (ticket.status === 'cancelled') {
				throw error(400, 'Ticket is already cancelled');
			}

			// Proceed with cancellation
			await pool.query('UPDATE tickets SET status = $1 WHERE id = $2', ['cancelled', ticketId]);

			return { success: true };
		} catch (err) {
			console.error('Error cancelling ticket:', err);
			throw error(500, 'Failed to cancel ticket');
		}
	}
};
