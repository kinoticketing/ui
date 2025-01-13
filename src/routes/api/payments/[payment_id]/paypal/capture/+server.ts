// src/routes/api/payments/[payment_id]/paypal/capture/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } from '$env/static/private';
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

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const client = await pool.connect();
	const session = await locals.getSession();

	if (!session?.user?.id) {
		return new Response('Unauthorized', { status: 401 });
	}

	try {
		const { orderId } = await request.json();
		const paymentId = params.payment_id;

		// Get access token
		const tokenRes = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				Authorization: `Basic ${Buffer.from(PAYPAL_CLIENT_ID + ':' + PAYPAL_CLIENT_SECRET).toString('base64')}`,
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: 'grant_type=client_credentials'
		});

		const { access_token } = await tokenRes.json();

		// Capture payment
		const captureRes = await fetch(
			`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${access_token}`
				}
			}
		);

		const captureData = await captureRes.json();

		// Update database
		await client.query('BEGIN');

		// Update payment status
		await client.query(
			`
            UPDATE payments 
            SET status = 'completed',
                provider_transaction_id = $1,
                updated_at = NOW()
            WHERE id = $2
        `,
			[captureData.id, paymentId]
		);

		// Update tickets status
		await client.query(
			`
            UPDATE tickets 
            SET status = 'confirmed',
                updated_at = NOW()
            WHERE payment_id = $1
        `,
			[paymentId]
		);

		await client.query('COMMIT');

		return json({ success: true, data: captureData });
	} catch (error) {
		await client.query('ROLLBACK');
		console.error('PayPal capture error:', error);
		return new Response('PayPal Error', { status: 500 });
	} finally {
		client.release();
	}
};
