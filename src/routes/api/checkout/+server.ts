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

interface SeatSelection {
	seatId: number;
	price: number;
}

interface CheckoutRequest {
	screeningId: number;
	seats: SeatSelection[];
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const client = await pool.connect();
	try {
		const session = await locals.getSession();
		if (!session?.user?.id) {
			return new Response('Unauthorized', { status: 401 });
		}

		const { screeningId, seats } = (await request.json()) as CheckoutRequest;

		// Validate required parameters
		if (!screeningId || !seats || !Array.isArray(seats) || seats.length === 0) {
			return json(
				{
					error: 'Invalid request: missing required parameters'
				},
				{ status: 400 }
			);
		}

		await client.query('BEGIN');

		// 1. Verify seats are still available and locked by this user
		const seatAvailability = await client.query<{ id: number; status: string }>(
			`
            SELECT s.id,
                   CASE
                       WHEN sl.user_id IS NULL THEN 'available'
                       WHEN sl.user_id != $1 THEN 'locked_by_other'
                       WHEN sl.user_id = $1 THEN 'locked_by_user'
                   END as status
            FROM unnest($2::int[]) seat_id(id)
            JOIN seats s ON s.id = seat_id.id
            LEFT JOIN seat_locks sl ON sl.seat_id = s.id
            WHERE NOT EXISTS (
                SELECT 1 FROM tickets t
                WHERE t.seat_id = s.id
                AND t.screening_id = $3
                AND t.status != 'cancelled'
            )
            `,
			[session.user.id, seats.map((s) => s.seatId), screeningId]
		);

		// Check if we got back the same number of seats we requested
		if (seatAvailability.rows.length !== seats.length) {
			await client.query('ROLLBACK');
			return json(
				{
					error: 'Some selected seats no longer exist'
				},
				{ status: 409 }
			);
		}

		// Check if all seats are locked by the current user
		const unavailableSeats = seatAvailability.rows.filter((s) => s.status !== 'locked_by_user');
		if (unavailableSeats.length > 0) {
			await client.query('ROLLBACK');
			return json(
				{
					error: 'Some seats are no longer available or not properly locked',
					seats: unavailableSeats
				},
				{ status: 409 }
			);
		}

		// Verify all seats belong to the specified screening
		const screeningCheck = await client.query(
			`
    SELECT COUNT(*) as count
    FROM seats s
    JOIN halls h ON s.hall_id = h.id
    JOIN screenings scr ON scr.hall_id = h.id
    WHERE s.id = ANY($1::int[])
    AND scr.id = $2
    AND scr.hall_id = h.id  -- Make sure we're checking the correct hall
    AND s.hall_id = scr.hall_id  -- Ensure seats belong to the same hall
    `,
			[seats.map((s) => s.seatId), screeningId]
		);

		if (screeningCheck.rows[0].count !== seats.length) {
			await client.query('ROLLBACK');
			return json(
				{
					error: 'Some seats do not belong to the specified screening'
				},
				{ status: 409 }
			);
		}

		// Update seat locks with a fresh timestamp to give more time
		await client.query(
			`
            UPDATE seat_locks
            SET locked_at = NOW()
            WHERE seat_id = ANY($1::int[])
            AND user_id = $2
            `,
			[seats.map((s) => s.seatId), session.user.id]
		);

		await client.query('COMMIT');

		// Successfully added to cart
		return json({
			success: true,
			message: 'Successfully added to cart',
			seats: seats.map((seat) => ({
				seatId: seat.seatId,
				price: seat.price
			}))
		});
	} catch (error) {
		await client.query('ROLLBACK');
		console.error('Error processing checkout:', error);
		return json({ error: 'Internal Server Error processing checkout' }, { status: 500 });
	} finally {
		client.release();
	}
};
