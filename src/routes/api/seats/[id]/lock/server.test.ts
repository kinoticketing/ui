import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, DELETE } from './+server';
import { Pool } from 'pg';

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

describe('Seat Lock API', () => {
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

    describe('POST endpoint', () => {
        it('should reject unauthorized requests', async () => {
            const response = await POST({
                request: new Request('http://localhost', {
                    method: 'POST',
                    body: JSON.stringify({ screeningId: 1 })
                }),
                params: { id: '1' },
                locals: { getSession: () => Promise.resolve(null) }
            } as any);

            expect(response.status).toBe(401);
            expect(await response.text()).toBe('Unauthorized');
        });

        it('should successfully lock an available seat', async () => {
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [] }) // Clean expired locks
                .mockResolvedValueOnce({ rows: [] }) // Lock check
                .mockResolvedValueOnce({ rows: [] }) // Booking check
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Insert lock
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            const response = await POST({
                request: new Request('http://localhost', {
                    method: 'POST',
                    body: JSON.stringify({ screeningId: 1 })
                }),
                params: { id: '1' },
                locals: { getSession: () => Promise.resolve({ user: { id: 'user123' } }) }
            } as any);

            const result = await response.json();
            expect(response.status).toBe(200);
            expect(result).toEqual({ success: true });
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
        });

        it('should handle already locked seats', async () => {
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [] }) // Clean expired locks
                .mockResolvedValueOnce({ rows: [{ user_id: 'other_user' }] }); // Lock check

            const response = await POST({
                request: new Request('http://localhost', {
                    method: 'POST',
                    body: JSON.stringify({ screeningId: 1 })
                }),
                params: { id: '1' },
                locals: { getSession: () => Promise.resolve({ user: { id: 'user123' } }) }
            } as any);

            const result = await response.json();
            expect(response.status).toBe(409);
            expect(result).toEqual({ error: 'Seat is already selected by another user' });
        });

        it('should handle already booked seats', async () => {
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [] }) // Clean expired locks
                .mockResolvedValueOnce({ rows: [] }) // Lock check
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Booking check

            const response = await POST({
                request: new Request('http://localhost', {
                    method: 'POST',
                    body: JSON.stringify({ screeningId: 1 })
                }),
                params: { id: '1' },
                locals: { getSession: () => Promise.resolve({ user: { id: 'user123' } }) }
            } as any);

            const result = await response.json();
            expect(response.status).toBe(409);
            expect(result).toEqual({ error: 'Seat is already booked' });
        });
    });

    describe('DELETE endpoint', () => {
        it('should reject unauthorized requests', async () => {
            const response = await DELETE({
                params: { id: '1' },
                locals: { getSession: () => Promise.resolve(null) }
            } as any);

            expect(response.status).toBe(401);
            expect(await response.text()).toBe('Unauthorized');
        });

        it('should successfully unlock a seat', async () => {
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Delete lock
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            const response = await DELETE({
                params: { id: '1' },
                locals: { getSession: () => Promise.resolve({ user: { id: 'user123' } }) }
            } as any);

            const result = await response.json();
            expect(response.status).toBe(200);
            expect(result).toEqual({ success: true });
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
        });

        it('should handle database errors', async () => {
            mockClient.query.mockRejectedValueOnce(new Error('Database error'));

            const response = await DELETE({
                params: { id: '1' },
                locals: { getSession: () => Promise.resolve({ user: { id: 'user123' } }) }
            } as any);

            expect(response.status).toBe(500);
            expect(await response.text()).toBe('Internal Server Error');
            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
        });
    });
});
