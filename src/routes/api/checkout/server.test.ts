import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server';
import { Pool } from 'pg';
import crypto from 'crypto';

// Mock crypto
vi.mock('crypto', () => ({
    default: {
        randomBytes: vi.fn(() => ({
            toString: () => 'mockedTicketCode123'
        }))
    }
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

describe('Checkout API', () => {
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
            locals: { 
                getSession: () => Promise.resolve(null) // Provide getSession that returns null
            },
            request: new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({
                    screeningId: 1,
                    seats: [{ seatId: 1, price: 10 }]
                })
            })
        } as any);

        expect(response.status).toBe(401);
        expect(await response.text()).toBe('Unauthorized');
    });

    it('should validate seat availability', async () => {
        mockClient.query
            .mockResolvedValueOnce({ rows: [] }) // BEGIN
            .mockResolvedValueOnce({ 
                rows: [{ id: 1, status: 'locked_by_other' }] 
            }); // Seat availability check

        const response = await POST({
            locals: { getSession: () => Promise.resolve({ user: { id: 'user123' } }) },
            request: new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({
                    screeningId: 1,
                    seats: [{ seatId: 1, price: 10 }]
                })
            })
        } as any);

        const result = await response.json();
        expect(response.status).toBe(409);
        expect(result.error).toBe('Some seats are no longer available');
        expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should successfully process checkout', async () => {
        const mockPaymentId = 123;
        mockClient.query
            .mockResolvedValueOnce({ rows: [] }) // BEGIN
            .mockResolvedValueOnce({ rows: [{ id: 1, status: 'available' }] }) // Seat availability
            .mockResolvedValueOnce({ rows: [{ id: mockPaymentId }] }) // Payment record
            .mockResolvedValueOnce({ rows: [] }) // Ticket creation
            .mockResolvedValueOnce({ rows: [] }) // Seat reservations
            .mockResolvedValueOnce({ rows: [] }) // Remove locks
            .mockResolvedValueOnce({ rows: [] }); // COMMIT

        const response = await POST({
            locals: { getSession: () => Promise.resolve({ user: { id: 'user123' } }) },
            request: new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({
                    screeningId: 1,
                    seats: [{ seatId: 1, price: 10 }]
                })
            })
        } as any);

        const result = await response.json();
        expect(response.status).toBe(200);
        expect(result).toEqual({
            success: true,
            checkoutUrl: `/checkout/${mockPaymentId}`,
            paymentId: mockPaymentId
        });
        expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
        expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
        mockClient.query.mockRejectedValueOnce(new Error('Database error'));

        const response = await POST({
            locals: { getSession: () => Promise.resolve({ user: { id: 'user123' } }) },
            request: new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({
                    screeningId: 1,
                    seats: [{ seatId: 1, price: 10 }]
                })
            })
        } as any);

        expect(response.status).toBe(500);
        expect(await response.text()).toBe('Internal Server Error');
        expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
        expect(mockClient.release).toHaveBeenCalled();
    });

    it('should calculate total amount correctly', async () => {
        mockClient.query
            .mockResolvedValueOnce({ rows: [] }) // BEGIN
            .mockResolvedValueOnce({ rows: [
                { id: 1, status: 'available' },
                { id: 2, status: 'available' }
            ]}) // Seat availability
            .mockResolvedValueOnce({ rows: [{ id: 123 }] }) // Payment record
            .mockResolvedValueOnce({ rows: [] }) // Tickets
            .mockResolvedValueOnce({ rows: [] }) // Reservations
            .mockResolvedValueOnce({ rows: [] }) // Locks
            .mockResolvedValueOnce({ rows: [] }); // COMMIT

        await POST({
            locals: { getSession: () => Promise.resolve({ user: { id: 'user123' } }) },
            request: new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({
                    screeningId: 1,
                    seats: [
                        { seatId: 1, price: 10.50 },
                        { seatId: 2, price: 15.75 }
                    ]
                })
            })
        } as any);

        // Add type for query call array
        type QueryCall = [string, any[]];
        
        // Update the find callback with proper typing
        const paymentCall = mockClient.query.mock.calls.find((call: QueryCall) => 
            call[0].includes('INSERT INTO payments')
        );
        expect(paymentCall[1][1]).toBe(26.25); // 10.50 + 15.75
    });
});
