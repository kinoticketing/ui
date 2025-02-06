// src/routes/api/payments/[payment_id]/cancel/+server.ts
import { json } from '@sveltejs/kit';
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
	const session = await locals.getSession();
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const client = await pool.connect();
	try {
		// Start transaction
		await client.query('BEGIN');

		// Delete existing tickets first (to avoid foreign key constraints)
		await client.query(
			`DELETE FROM tickets 
             WHERE payment_id = $1 
             AND status = 'pending'`,
			[params.payment_id]
		);

		// Delete any reservations
		await client.query(
			`DELETE FROM seat_reservations 
             WHERE user_id = $1 
             AND EXISTS (
                 SELECT 1 
                 FROM tickets 
                 WHERE tickets.seat_id = seat_reservations.seat_id 
                 AND tickets.payment_id = $2
             )`,
			[session.user.id, params.payment_id]
		);

		// Update payment status
		await client.query(
			`UPDATE payments 
             SET status = 'cancelled', 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $1 
             AND user_id = $2 
             AND status = 'pending'`,
			[params.payment_id, session.user.id]
		);

		await client.query('COMMIT');
		return json({ success: true });
	} catch (error) {
		await client.query('ROLLBACK');
		console.error('Error cancelling payment:', error);
		return json({ error: 'Failed to cancel payment' }, { status: 500 });
	} finally {
		client.release();
	}
};
