// src/routes/checkout/[payment_id]/+page.server.ts
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { PaymentData } from './types';
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
			`SELECT status, created_at
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
			// Mark payment as expired
			await client.query(
				`UPDATE payments
                 SET status = 'expired'
                 WHERE id = $1`,
				[paymentId]
			);
			throw redirect(302, '/cart');
		}

		const result = await client.query<PaymentData>(
			`WITH payment_data AS (
                SELECT 
                    p.id as payment_id,
                    p.amount,
                    p.status as payment_status,
                    sc.id as screening_id,
                    sc.start_time as screening_time,
                    m.title,
                    m.poster_url,
                    m.imdb_id,
                    json_agg(json_build_object(
                        'id', t.id,
                        'seat_id', t.seat_id,
                        'seat_label', s.seat_label,
                        'row', s.row_number,
                        'column', s.column_number,
                        'price', t.price,
                        'ticket_code', t.ticket_code,
                        'screening_id', sc.id,
                        'category_name', scat.name
                    )) as tickets
                FROM payments p
                JOIN tickets t ON t.payment_id = p.id
                JOIN seats s ON s.id = t.seat_id
                JOIN seat_categories scat ON s.category_id = scat.id
                JOIN screenings sc ON sc.id = t.screening_id
                JOIN movies m ON m.imdb_id = sc.movie_id
                WHERE p.id = $1 AND p.user_id = $2
                GROUP BY p.id, p.amount, p.status, sc.id, sc.start_time, m.title, m.poster_url, m.imdb_id
            )
            SELECT *,
                   CASE
                       WHEN EXISTS (
                           SELECT 1 FROM seat_reservations sr
                           JOIN tickets t ON t.seat_id = sr.seat_id
                           WHERE t.payment_id = payment_data.payment_id
                           AND sr.expiration_time < NOW()
                       ) THEN true
                       ELSE false
                   END as is_expired
            FROM payment_data`,
			[paymentId, session.user.id]
		);

		if (result.rows.length === 0) {
			throw redirect(302, '/cart');
		}

		// Check if any seats have expired reservations
		const hasExpiredReservations = result.rows[0].is_expired;
		if (hasExpiredReservations) {
			// Mark payment as expired
			await client.query(
				`UPDATE payments
                 SET status = 'expired'
                 WHERE id = $1`,
				[paymentId]
			);
			throw redirect(302, '/cart');
		}

		return {
			payment: {
				id: result.rows[0].payment_id,
				amount: parseFloat(result.rows[0].amount),
				status: result.rows[0].payment_status
			},
			screenings: result.rows.map((row) => ({
				id: row.screening_id,
				time: row.screening_time,
				movie: {
					title: row.title,
					poster_url: row.poster_url,
					imdb_id: row.imdb_id
				},
				tickets: row.tickets.filter((t) => t.screening_id === row.screening_id)
			}))
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
