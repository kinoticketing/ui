import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './+server';
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

describe('User Reservations API', () => {
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
        const response = await GET({
            locals: { getSession: () => Promise.resolve(null) }
        } as any);

        expect(response.status).toBe(401);
        expect(await response.text()).toBe('Unauthorized');
    });

    it('should return user reservations successfully', async () => {
        const mockReservations = [{
            id: '123',
            ticket_code: 'ABC123',
            status: 'confirmed',
            price: 10.99,
            booking_date: '2024-01-20T10:00:00Z',
            movie_title: 'Test Movie',
            screening_time: '2024-01-21T15:00:00Z',
            hall_name: 'Hall 1',
            seat_label: 'A1'
        }];

        mockClient.query.mockResolvedValueOnce({
            rows: mockReservations
        });

        const response = await GET({
            locals: { getSession: () => Promise.resolve({ user: { id: 'user123' } }) }
        } as any);

        const result = await response.json();
        expect(response.status).toBe(200);
        expect(result).toEqual(mockReservations);
        expect(mockClient.query).toHaveBeenCalledWith(
            expect.stringContaining('SELECT'),
            ['user123']
        );
        expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
        mockClient.query.mockRejectedValueOnce(new Error('Database error'));

        const response = await GET({
            locals: { getSession: () => Promise.resolve({ user: { id: 'user123' } }) }
        } as any);

        expect(response.status).toBe(500);
        expect(await response.text()).toBe('Internal Server Error');
        expect(mockClient.release).toHaveBeenCalled();
    });

    it('should only return confirmed reservations', async () => {
        mockClient.query.mockResolvedValueOnce({ rows: [] });

        await GET({
            locals: { getSession: () => Promise.resolve({ user: { id: 'user123' } }) }
        } as any);

        const queryString = mockClient.query.mock.calls[0][0];
        expect(queryString).toContain("t.status = 'confirmed'");
    });

    it('should order reservations by creation date', async () => {
        mockClient.query.mockResolvedValueOnce({ rows: [] });

        await GET({
            locals: { getSession: () => Promise.resolve({ user: { id: 'user123' } }) }
        } as any);

        const queryString = mockClient.query.mock.calls[0][0];
        expect(queryString).toContain('ORDER BY t.created_at DESC');
    });
});
