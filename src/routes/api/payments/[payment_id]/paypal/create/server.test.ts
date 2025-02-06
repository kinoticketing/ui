/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server';

// Mock fetch globally
global.fetch = vi.fn();

// Mock environment variables
vi.mock('$env/static/private', () => ({
	PAYPAL_CLIENT_ID: 'test_client_id',
	PAYPAL_CLIENT_SECRET: 'test_client_secret'
}));

describe('PayPal Create Order Endpoint', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should reject unauthorized requests', async () => {
		const response = await POST({
			locals: { getSession: () => Promise.resolve(null) },
			request: new Request('http://localhost', {
				method: 'POST',
				body: JSON.stringify({ amount: 100 })
			})
		} as any);

		expect(response.status).toBe(401);
		expect(await response.text()).toBe('Unauthorized');
	});

	it('should successfully create PayPal order', async () => {
		const mockOrderData = {
			id: 'test_order_id',
			status: 'CREATED',
			links: [{ href: 'https://paypal.com/checkout' }]
		};

		vi.mocked(fetch)
			.mockResolvedValueOnce({
				json: () => Promise.resolve({ access_token: 'test_access_token' }),
				ok: true
			} as any)
			.mockResolvedValueOnce({
				json: () => Promise.resolve(mockOrderData),
				ok: true
			} as any);

		const response = await POST({
			locals: { getSession: () => Promise.resolve({ user: { id: 'user123' } }) },
			request: new Request('http://localhost', {
				method: 'POST',
				body: JSON.stringify({ amount: 100 })
			})
		} as any);

		const result = await response.json();
		expect(response.status).toBe(200);
		expect(result).toEqual(mockOrderData);

		// Verify PayPal API calls
		expect(fetch).toHaveBeenCalledWith(
			'https://api-m.sandbox.paypal.com/v1/oauth2/token',
			expect.objectContaining({
				method: 'POST',
				headers: expect.objectContaining({
					'Content-Type': 'application/x-www-form-urlencoded'
				})
			})
		);

		expect(fetch).toHaveBeenCalledWith(
			'https://api-m.sandbox.paypal.com/v2/checkout/orders',
			expect.objectContaining({
				method: 'POST',
				headers: expect.objectContaining({
					Authorization: 'Bearer test_access_token'
				}),
				body: expect.stringContaining('"value":"100"')
			})
		);
	});

	it('should handle PayPal API errors during token fetch', async () => {
		vi.mocked(fetch).mockRejectedValueOnce(new Error('Token fetch failed'));

		const response = await POST({
			locals: { getSession: () => Promise.resolve({ user: { id: 'user123' } }) },
			request: new Request('http://localhost', {
				method: 'POST',
				body: JSON.stringify({ amount: 100 })
			})
		} as any);

		expect(response.status).toBe(500);
		expect(await response.text()).toBe('PayPal Error');
	});

	it('should handle PayPal API errors during order creation', async () => {
		vi.mocked(fetch)
			.mockResolvedValueOnce({
				json: () => Promise.resolve({ access_token: 'test_access_token' }),
				ok: true
			} as any)
			.mockRejectedValueOnce(new Error('Order creation failed'));

		const response = await POST({
			locals: { getSession: () => Promise.resolve({ user: { id: 'user123' } }) },
			request: new Request('http://localhost', {
				method: 'POST',
				body: JSON.stringify({ amount: 100 })
			})
		} as any);

		expect(response.status).toBe(500);
		expect(await response.text()).toBe('PayPal Error');
	});

	it('should verify proper amount formatting', async () => {
		vi.mocked(fetch)
			.mockResolvedValueOnce({
				json: () => Promise.resolve({ access_token: 'test_access_token' }),
				ok: true
			} as any)
			.mockResolvedValueOnce({
				json: () => Promise.resolve({ id: 'test_order_id' }),
				ok: true
			} as any);

		await POST({
			locals: { getSession: () => Promise.resolve({ user: { id: 'user123' } }) },
			request: new Request('http://localhost', {
				method: 'POST',
				body: JSON.stringify({
					amount: 99.99,
					screenings: [
						{
							id: 1,
							tickets: [
								{
									seat_label: 'A1',
									price: 99.99
								}
							]
						}
					]
				})
			})
		} as any);

		const orderCall = vi.mocked(fetch).mock.calls[1];
		const orderBody = JSON.parse(orderCall[1]?.body as string);

		expect(orderBody.purchase_units[0].amount).toEqual({
			currency_code: 'EUR',
			value: '99.99',
			breakdown: {
				item_total: {
					currency_code: 'EUR',
					value: '99.99'
				}
			}
		});
	});
});
