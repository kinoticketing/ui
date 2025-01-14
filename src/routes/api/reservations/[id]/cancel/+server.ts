import { error, json } from '@sveltejs/kit';
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

export const POST: RequestHandler = async ({ params, locals }) => {
	const ticketId = params.id;
	const session = await locals.getSession();

	if (!session?.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		// First check if the ticket belongs to the user
		const checkQuery = `
            SELECT t.*, s.start_time 
            FROM tickets t
            JOIN screenings s ON t.screening_id = s.id
            JOIN users u ON t.user_id = u.id
            WHERE t.id = $1 AND u.id = $2
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

		return json({ success: true });
	} catch (err) {
		console.error('Error cancelling ticket:', err);
		throw error(500, 'Failed to cancel ticket');
	}
};
