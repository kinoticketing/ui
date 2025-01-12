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
    const client = await pool.connect();
    
    try {
        const session = await locals.getSession();
        if (!session?.user?.id) {
            throw redirect(302, '/login');
        }

        const paymentId = parseInt(params.payment_id);
        if (isNaN(paymentId)) {
            throw error(400, 'Invalid payment ID');
        }

        // Get payment and associated data
        const result = await client.query<PaymentData>(`
            WITH payment_data AS (
                SELECT 
                       p.id as payment_id,  -- This is already correctly aliased
                       p.amount,
                       p.status as payment_status,
                       array_agg(json_build_object(
                           'id', t.id,
                           'seat_id', t.seat_id,
                           'seat_label', s.seat_label,
                           'row', s.row_number,
                           'column', s.column_number,
                           'price', t.price,
                           'ticket_code', t.ticket_code
                       )) as tickets,
                       sc.id as screening_id,
                       sc.start_time as screening_time,
                       m.title,
                       m.poster_url,
                       m.imdb_id
                FROM payments p
                JOIN tickets t ON t.payment_id = p.id
                JOIN seats s ON s.id = t.seat_id
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
                           WHERE t.payment_id = payment_data.payment_id  -- Changed from pd.id to payment_data.payment_id
                           AND sr.expiration_time < NOW()
                       ) THEN true
                       ELSE false
                   END as is_expired
            FROM payment_data
        `, [paymentId, session.user.id]);

        if (result.rows.length === 0) {
            throw error(404, 'Payment not found');
        }

        const paymentData = result.rows[0];
        
        // Check if reservation has expired
        if (paymentData.is_expired) {
            // Clean up expired reservations
            await client.query('BEGIN');
            
            // Delete tickets
            await client.query(`
                DELETE FROM tickets WHERE payment_id = $1
            `, [paymentId]);
            
            // Delete payment
            await client.query(`
                DELETE FROM payments WHERE id = $1
            `, [paymentId]);
            
            // Delete reservations
            await client.query(`
                DELETE FROM seat_reservations
                WHERE seat_id = ANY(
                    SELECT seat_id FROM tickets WHERE payment_id = $1
                )
            `, [paymentId]);
            
            await client.query('COMMIT');
            
            throw redirect(302, '/expired');
        }

        // Check if payment is already completed
        if (paymentData.payment_status === 'completed') {
            throw redirect(302, `/checkout/${paymentId}/success`);
        }

        return {
            payment: {
                id: paymentData.payment_id,
                amount: parseFloat(paymentData.amount),
                status: paymentData.payment_status
            },
            tickets: paymentData.tickets,
            movie: {
                title: paymentData.title,
                poster_url: paymentData.poster_url,
                imdb_id: paymentData.imdb_id
            },
            screening: {
                id: paymentData.screening_id,
                start_time: paymentData.screening_time
            }
        };

    } catch (e) {
        if (e instanceof redirect) {
            throw e;
        }
        console.error('Error loading checkout page:', e);
        throw error(500, 'Error loading checkout page');
    } finally {
        client.release();
    }
}) satisfies PageServerLoad;