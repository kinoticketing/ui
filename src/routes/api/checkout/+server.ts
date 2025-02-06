import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import pkg from 'pg';
import crypto from 'crypto';
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

interface SeatSelection {
	seatId: number;
	price: number;
}

interface ScreeningCheckout {
	screeningId: number;
	seats: SeatSelection[];
}

interface CheckoutRequest {
	screenings: ScreeningCheckout[];
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const client = await pool.connect();
	try {
		const session = await locals.getSession();
		if (!session?.user?.id) {
			return new Response('Unauthorized', { status: 401 });
		}

		const { screenings } = (await request.json()) as CheckoutRequest;

		await client.query('BEGIN');

		// Calculate total amount across all screenings
		const totalAmount = screenings.reduce(
			(total, screening) =>
				total + screening.seats.reduce((sum, seat) => sum + parseFloat(seat.price.toString()), 0),
			0
		);

		// First, clean up any existing pending tickets and reservations for all screenings
		for (const screening of screenings) {
			// Clean up existing pending tickets
			await client.query(
				`DELETE FROM tickets 
                 WHERE screening_id = $1 
                 AND seat_id = ANY($2::int[])
                 AND status = 'pending'
                 AND user_id = $3`,
				[screening.screeningId, screening.seats.map((s) => s.seatId), session.user.id]
			);

			// Clean up existing reservations
			await client.query(
				`DELETE FROM seat_reservations 
                 WHERE screening_id = $1
                 AND seat_id = ANY($2::int[])
                 AND user_id = $3`,
				[screening.screeningId, screening.seats.map((s) => s.seatId), session.user.id]
			);

			// Check for any existing confirmed tickets for these seats
			const existingTickets = await client.query(
				`SELECT t.seat_id, t.status
                 FROM tickets t
                 WHERE t.screening_id = $1 
                 AND t.seat_id = ANY($2::int[])
                 AND t.status = 'confirmed'`,
				[screening.screeningId, screening.seats.map((s) => s.seatId)]
			);

			if (existingTickets.rows.length > 0) {
				const seatIds = existingTickets.rows.map((t) => t.seat_id).join(', ');
				throw new Error(
					`Seats ${seatIds} already have active tickets for screening ${screening.screeningId}`
				);
			}
		}

		// Create single payment record for all screenings
		const paymentResult = await client.query<{ id: number }>(
			`INSERT INTO payments (user_id, amount, status, provider)
             VALUES ($1, $2, 'pending', 'stripe')
             RETURNING id`,
			[session.user.id, totalAmount]
		);

		const paymentId = paymentResult.rows[0].id;

		// Process each screening
		for (const screening of screenings) {
			// Create tickets for this screening
			for (const seat of screening.seats) {
				const ticketCode = crypto.randomBytes(16).toString('hex');

				await client.query(
					`INSERT INTO tickets (
                        user_id, screening_id, seat_id, payment_id, 
                        price, ticket_code, status, created_at
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())`,
					[session.user.id, screening.screeningId, seat.seatId, paymentId, seat.price, ticketCode]
				);

				await client.query(
					`INSERT INTO seat_reservations (
                        screening_id, seat_id, user_id, status,
                        reservation_time, expiration_time
                    )
                    VALUES ($1, $2, $3, 'pending', NOW(), NOW() + interval '15 minutes')`,
					[screening.screeningId, seat.seatId, session.user.id]
				);
			}

			// Remove seat locks
			await client.query(
				`DELETE FROM seat_locks
                 WHERE seat_id = ANY($1::int[])
                 AND user_id = $2`,
				[screening.seats.map((s) => s.seatId), session.user.id]
			);
		}

		await client.query('COMMIT');

		return json({
			success: true,
			checkoutUrl: `/checkout/${paymentId}`,
			paymentId
		});
	} catch (error) {
		await client.query('ROLLBACK');
		console.error('Error processing checkout:', error);

		if (error instanceof Error) {
			return json(
				{
					error: error.message,
					code: 'CHECKOUT_ERROR'
				},
				{ status: 409 }
			);
		}

		return json(
			{
				error: 'An unexpected error occurred',
				code: 'INTERNAL_ERROR'
			},
			{ status: 500 }
		);
	} finally {
		client.release();
	}
};
