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

		// Get payment and ticket information
		const result = await client.query(
			`
            SELECT 
                p.id as payment_id,
                p.amount,
                p.status as payment_status,
                m.title as movie_title,
                sc.start_time as screening_time,
                array_agg(json_build_object(
                    'seat_label', s.seat_label,
                    'ticket_code', t.ticket_code
                )) as tickets
            FROM payments p
            JOIN tickets t ON t.payment_id = p.id
            JOIN seats s ON s.id = t.seat_id
            JOIN screenings sc ON sc.id = t.screening_id
            JOIN movies m ON m.imdb_id = sc.movie_id
            WHERE p.id = $1 AND p.user_id = $2 AND p.status = 'completed'
            GROUP BY p.id, p.amount, p.status, m.title, sc.start_time
        `,
			[paymentId, session.user.id]
		);

		if (result.rows.length === 0) {
			throw redirect(302, '/checkout/' + paymentId);
		}

		return {
			payment: result.rows[0]
		};
	} catch (e) {
		if (e instanceof redirect) throw e;
		console.error('Error loading success page:', e);
		throw error(500, 'Error loading payment confirmation');
	} finally {
		client.release();
	}
}) satisfies PageServerLoad;
