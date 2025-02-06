// src/routes/api/payments/[payment_id]/paypal/create/+server.ts
/* eslint-disable @typescript-eslint/no-unused-vars */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } from '$env/static/private';

interface Ticket {
	seatLabel: string;
	price: number;
}

interface Screening {
	tickets: Ticket[];
}

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const session = await locals.getSession();
	if (!session?.user?.id) {
		return new Response('Unauthorized', { status: 401 });
	}

	try {
		const { amount, screenings } = await request.json();

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

		// Create itemized order
		const orderRes = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${access_token}`
			},
			body: JSON.stringify({
				intent: 'CAPTURE',
				purchase_units: [
					{
						amount: {
							currency_code: 'EUR',
							value: amount.toString(),
							breakdown: {
								item_total: {
									currency_code: 'EUR',
									value: amount.toString()
								}
							}
						},
						items:
							screenings
								?.map((screening: Screening) =>
									screening.tickets.map((ticket) => ({
										name: `Ticket - Seat ${ticket.seatLabel}`,
										quantity: '1',
										unit_amount: {
											currency_code: 'EUR',
											value: ticket.price.toString()
										}
									}))
								)
								.flat() || []
					}
				]
			})
		});

		const orderData = await orderRes.json();
		return json(orderData);
	} catch (error) {
		console.error('PayPal order creation error:', error);
		return new Response('PayPal Error', { status: 500 });
	}
};
