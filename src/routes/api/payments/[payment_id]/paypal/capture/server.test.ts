import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server';
import { Pool } from 'pg';

// Mock fetch globally
global.fetch = vi.fn();

// Mock environment variables
vi.mock('$env/static/private', () => ({
    PAYPAL_CLIENT_ID: 'test_client_id',
    PAYPAL_CLIENT_SECRET: 'test_client_secret'
}));

// Mock pg Pool
vi.mock('pg', () => {
    const query = vi.fn();
    const mockConnect = vi.fn(() => ({
        query: vi.fn(),
        release: vi.fn()
    }));
    return {
        __esModule: true,
        default: {
            Pool: vi.fn(() => ({
                query,
                connect: mockConnect
            }))
        },
        Pool: vi.fn(() => ({
            query,
            connect: mockConnect
        }))
    };
});

describe('PayPal Capture Endpoint', () => {
    let mockQuery: any;
    let mockConnect: any;
    let mockClient: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockQuery = vi.mocked(Pool)().query;
        mockConnect = vi.mocked(Pool)().connect;
        mockClient = {
            query: vi.fn(),
            release: vi.fn()
        };
        mockConnect.mockResolvedValue(mockClient);
    });

    it('should reject unauthorized requests', async () => {
        const response = await POST({
            params: { payment_id: '123' },
            locals: { getSession: () => Promise.resolve(null) },
            request: new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ orderId: 'test_order' })
            })
        } as any);

        expect(response.status).toBe(401);
        expect(await response.text()).toBe('Unauthorized');
    });

    it('should successfully capture payment', async () => {
        // Mock PayPal API responses
        vi.mocked(fetch)
            .mockResolvedValueOnce({
                json: () => Promise.resolve({ access_token: 'test_token' }),
                ok: true
            } as any)
            .mockResolvedValueOnce({
                json: () => Promise.resolve({ 
                    id: 'capture_id_123',
                    status: 'COMPLETED' 
                }),
                ok: true
            } as any);

        mockClient.query
            .mockResolvedValueOnce({ rows: [] }) // BEGIN
            .mockResolvedValueOnce({ rows: [] }) // Update payment
            .mockResolvedValueOnce({ rows: [] }) // Update tickets
            .mockResolvedValueOnce({ rows: [] }); // COMMIT

        const response = await POST({
            params: { payment_id: '123' },
            locals: { getSession: () => Promise.resolve({ user: { id: 'user123' } }) },
            request: new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ orderId: 'test_order' })
            })
        } as any);

        const result = await response.json();
        expect(response.status).toBe(200);
        expect(result).toEqual({
            success: true,
            data: { id: 'capture_id_123', status: 'COMPLETED' }
        });
        expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
        expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should handle PayPal API errors', async () => {
        vi.mocked(fetch).mockRejectedValueOnce(new Error('PayPal API Error'));

        const response = await POST({
            params: { payment_id: '123' },
            locals: { getSession: () => Promise.resolve({ user: { id: 'user123' } }) },
            request: new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ orderId: 'test_order' })
            })
        } as any);

        expect(response.status).toBe(500);
        expect(await response.text()).toBe('PayPal Error');
        expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should handle database errors', async () => {
        vi.mocked(fetch)
            .mockResolvedValueOnce({
                json: () => Promise.resolve({ access_token: 'test_token' }),
                ok: true
            } as any)
            .mockResolvedValueOnce({
                json: () => Promise.resolve({ id: 'capture_id_123' }),
                ok: true
            } as any);

        mockClient.query
            .mockResolvedValueOnce({ rows: [] }) // BEGIN
            .mockRejectedValueOnce(new Error('Database error')); // Update fails

        const response = await POST({
            params: { payment_id: '123' },
            locals: { getSession: () => Promise.resolve({ user: { id: 'user123' } }) },
            request: new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ orderId: 'test_order' })
            })
        } as any);

        expect(response.status).toBe(500);
        expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
        expect(mockClient.release).toHaveBeenCalled();
    });

    it('should verify PayPal API calls', async () => {
        vi.mocked(fetch)
            .mockResolvedValueOnce({
                json: () => Promise.resolve({ access_token: 'test_token' }),
                ok: true
            } as any)
            .mockResolvedValueOnce({
                json: () => Promise.resolve({ id: 'capture_id_123' }),
                ok: true
            } as any);

        mockClient.query
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] });

        await POST({
            params: { payment_id: '123' },
            locals: { getSession: () => Promise.resolve({ user: { id: 'user123' } }) },
            request: new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ orderId: 'test_order' })
            })
        } as any);

        // Verify OAuth token request
        expect(fetch).toHaveBeenCalledWith(
            'https://api-m.sandbox.paypal.com/v1/oauth2/token',
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'Content-Type': 'application/x-www-form-urlencoded'
                })
            })
        );

        // Verify capture request
        expect(fetch).toHaveBeenCalledWith(
            'https://api-m.sandbox.paypal.com/v2/checkout/orders/test_order/capture',
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    Authorization: 'Bearer test_token'
                })
            })
        );
    });
});
