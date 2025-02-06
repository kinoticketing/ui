/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server';

vi.mock('pg', () => {
	const pkg = {
		Pool: vi.fn(() => ({
			connect: () => mockClient
		}))
	};
	return { default: pkg, ...pkg };
});

vi.mock('crypto', () => ({
	default: {
		randomBytes: () => ({
			toString: () => 'mockedRandomString'
		})
	}
}));

const mockClient = {
	query: vi.fn(),
	release: vi.fn()
};

describe('Checkout API', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockClient.query.mockImplementation((query) => {
			if (query === 'BEGIN' || query === 'COMMIT' || query === 'ROLLBACK') {
				return Promise.resolve();
			}
			if (query.includes('INSERT INTO payments')) {
				return Promise.resolve({ rows: [{ id: 1 }] });
			}
			return Promise.resolve({ rows: [] });
		});
	});

	const mockRequest = {
		screenings: [
			{
				screeningId: 1,
				seats: [
					{ seatId: 1, price: 10.5 },
					{ seatId: 2, price: 15.75 }
				]
			}
		]
	};

	it('should successfully process checkout', async () => {
		const response = await POST({
			request: new Request('http://localhost', {
				method: 'POST',
				body: JSON.stringify(mockRequest)
			}),
			locals: {
				getSession: () => Promise.resolve({ user: { id: 'user123' } })
			}
		} as any);

		const result = await response.json();
		expect(response.status).toBe(200);
		expect(result).toEqual({
			success: true,
			checkoutUrl: '/checkout/1',
			paymentId: 1
		});
	});

	it('should validate seat availability', async () => {
		// Mock all queries
		mockClient.query.mockImplementation((query) => {
			if (query === 'BEGIN') return Promise.resolve();
			if (query.includes('SELECT t.seat_id')) {
				return Promise.resolve({
					rows: [{ seat_id: 1, status: 'confirmed' }]
				});
			}
			return Promise.resolve({ rows: [] });
		});

		const response = await POST({
			request: new Request('http://localhost', {
				method: 'POST',
				body: JSON.stringify(mockRequest)
			}),
			locals: {
				getSession: () => Promise.resolve({ user: { id: 'user123' } })
			}
		} as any);

		const result = await response.json();
		expect(response.status).toBe(409);
		expect(result.error).toBe('Seats 1 already have active tickets for screening 1');
	});
    
	it('should handle database errors', async () => {
		// First mock to return BEGIN successfully
		mockClient.query
			.mockResolvedValueOnce(undefined) // BEGIN works
			.mockImplementationOnce(() => {
				// Then fail on the first real query
				const error = { code: 'ECONNREFUSED' }; // Plain object, not Error instance
				return Promise.reject(error);
			});

		const response = await POST({
			request: new Request('http://localhost', {
				method: 'POST',
				body: JSON.stringify(mockRequest)
			}),
			locals: {
				getSession: () => Promise.resolve({ user: { id: 'user123' } })
			}
		} as any);

		const result = await response.json();
		expect(response.status).toBe(500);
		expect(result.error).toBe('An unexpected error occurred');
		expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
	});

	it('should calculate total amount correctly', async () => {
		await POST({
			request: new Request('http://localhost', {
				method: 'POST',
				body: JSON.stringify(mockRequest)
			}),
			locals: {
				getSession: () => Promise.resolve({ user: { id: 'user123' } })
			}
		} as any);

		const paymentCall = mockClient.query.mock.calls.find(
			(call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO payments')
		);

		expect(paymentCall[1][1]).toBe(26.25); // 10.50 + 15.75
	});
});
