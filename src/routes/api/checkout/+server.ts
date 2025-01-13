//src/routes/api/checkout/+server.ts
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

        const { screeningId, seats } = await request.json() as CheckoutRequest;

        await client.query('BEGIN');

        // 1. Verify seats are still available and locked by this user
        const seatAvailability = await client.query<{ id: number; status: string }>(`
            SELECT s.id, 
                   CASE 
                       WHEN sl.user_id != $1 THEN 'locked_by_other'
                       WHEN sr.id IS NOT NULL THEN 'already_reserved'
                       ELSE 'available'
                   END as status
            FROM unnest($2::int[]) seat_id(id)
            JOIN seats s ON s.id = seat_id.id
            LEFT JOIN seat_locks sl ON sl.seat_id = s.id
            LEFT JOIN seat_reservations sr ON sr.seat_id = s.id 
                AND sr.screening_id = $3 
                AND (sr.status = 'confirmed' OR 
                    (sr.status = 'pending' AND sr.expiration_time > NOW()))
        `, [session.user.id, seats.map(s => s.seatId), screeningId]);

        const unavailableSeats = seatAvailability.rows.filter(s => s.status !== 'available');
        if (unavailableSeats.length > 0) {
            await client.query('ROLLBACK');
            return json({ 
                error: 'Some seats are no longer available',
                seats: unavailableSeats
            }, { status: 409 });
        }

        // 2. Create payment record
        const totalAmount = seats.reduce((sum, seat) => sum + parseFloat(seat.price.toString()), 0);
        const paymentResult = await client.query<{ id: number }>(`
            INSERT INTO payments (user_id, amount, status, provider)
            VALUES ($1, $2, 'pending', 'stripe')
            RETURNING id
        `, [session.user.id, totalAmount]);

        const paymentId = paymentResult.rows[0].id;

        // 3. Create ticket records with unique codes
        for (const seat of seats) {
            const ticketCode = crypto.randomBytes(16).toString('hex');
            await client.query(`
                INSERT INTO tickets (
                    user_id, screening_id, seat_id, payment_id, 
                    price, ticket_code, status
                ) VALUES ($1, $2, $3, $4, $5, $6, 'pending')
            `, [
                session.user.id,
                screeningId,
                seat.seatId,
                paymentId,
                seat.price,
                ticketCode
            ]);
        }

        // 4. Create seat reservations
        await client.query(`
            INSERT INTO seat_reservations (
                screening_id, seat_id, user_id, status,
                reservation_time, expiration_time
            )
            SELECT 
                $1, 
                unnest($2::int[]), 
                $3, 
                'pending',
                NOW(),
                NOW() + interval '15 minutes'
        `, [screeningId, seats.map(s => s.seatId), session.user.id]);

        // 5. Remove seat locks
        await client.query(`
            DELETE FROM seat_locks
            WHERE seat_id = ANY($1::int[])
            AND user_id = $2
        `, [seats.map(s => s.seatId), session.user.id]);

        await client.query('COMMIT');

        return json({
            success: true,
            checkoutUrl: `/checkout/${paymentId}`,
            paymentId
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error processing checkout:', error);
        return new Response('Internal Server Error', { status: 500 });
    } finally {
        client.release();
    }
};