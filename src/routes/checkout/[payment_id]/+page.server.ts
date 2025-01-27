// src/routes/checkout/[payment_id]/+page.server.ts
import { error, redirect } from '@sveltejs/kit';
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

export const load = (async ({ params, locals }) => {
	const session = await locals.getSession();
	if (!session?.user?.id) {
		throw redirect(302, '/auth/login');
	}

	const client = await pool.connect();
	try {
		const paymentId = parseInt(params.payment_id);
		if (isNaN(paymentId)) {
			throw error(400, 'Invalid payment ID');
		}

		// First check if the payment exists and is still valid
		const paymentCheck = await client.query(
			`SELECT status, created_at, amount
             FROM payments
             WHERE id = $1 AND user_id = $2`,
			[paymentId, session.user.id]
		);

		if (paymentCheck.rows.length === 0) {
			throw redirect(302, '/cart');
		}

		const payment = paymentCheck.rows[0];

		// Check if payment is cancelled or expired
		if (payment.status === 'cancelled') {
			throw redirect(302, '/cart');
		}

		// Check if payment is expired (15 minutes old)
		const paymentAge = new Date().getTime() - new Date(payment.created_at).getTime();
		if (paymentAge > 15 * 60 * 1000) {
			await client.query(
				`UPDATE payments
                 SET status = 'expired'
                 WHERE id = $1`,
				[paymentId]
			);
			throw redirect(302, '/cart');
		}

		// Get all screenings and tickets in this payment
		const result = await client.query(
			`SELECT 
				s.id as screening_id,
				s.start_time,
				m.title,
				m.poster_url,
				m.imdb_id,
				t.id as ticket_id,
				t.seat_id,
				CAST(t.price AS FLOAT) as price,
				t.ticket_code,
				seats.seat_label,
				seats.row_number as row,
				seats.column_number as column,
				sc.name as category_name
			 FROM screenings s
			 JOIN tickets t ON t.screening_id = s.id
			 JOIN movies m ON m.imdb_id = s.movie_id
			 JOIN seats ON seats.id = t.seat_id
			 JOIN seat_categories sc ON sc.id = seats.category_id
			 WHERE t.payment_id = $1
			 ORDER BY s.start_time, seats.row_number, seats.column_number`,
			[paymentId]
		);

		// Check if any seats have expired reservations
		const expiredReservations = await client.query(
			`SELECT 1 
             FROM seat_reservations sr
             JOIN tickets t ON t.seat_id = sr.seat_id
             WHERE t.payment_id = $1
             AND sr.expiration_time < NOW()
             LIMIT 1`,
			[paymentId]
		);

		if (expiredReservations.rows.length > 0) {
			await client.query(
				`UPDATE payments
                 SET status = 'expired'
                 WHERE id = $1`,
				[paymentId]
			);
			throw redirect(302, '/cart');
		}

		// Group tickets by screening
		const screeningsMap = new Map();

		result.rows.forEach((row) => {
			if (!screeningsMap.has(row.screening_id)) {
				screeningsMap.set(row.screening_id, {
					id: row.screening_id,
					time: row.start_time,
					movie: {
						title: row.title,
						poster_url: row.poster_url,
						imdb_id: row.imdb_id
					},
					tickets: []
				});
			}

			const screening = screeningsMap.get(row.screening_id);
			screening.tickets.push({
				id: row.ticket_id,
				seat_id: row.seat_id,
				seat_label: row.seat_label,
				row: row.row,
				column: row.column,
				price: row.price,
				ticket_code: row.ticket_code,
				category_name: row.category_name,
				screening_id: row.screening_id
			});
		});

		return {
			payment: {
				id: paymentId,
				amount: parseFloat(payment.amount),
				status: payment.status
			},
			screenings: Array.from(screeningsMap.values())
		};
	} catch (err) {
		if (err instanceof Error && 'location' in err) {
			throw err; // Re-throw redirect
		}
		console.error('Error loading checkout page:', err);
		throw redirect(302, '/cart');
	} finally {
		client.release();
	}
}) satisfies PageServerLoad;
