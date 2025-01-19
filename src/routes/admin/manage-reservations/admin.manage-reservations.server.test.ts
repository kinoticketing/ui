import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';
import { Pool } from 'pg';

// Mock the pg Pool
vi.mock('pg', () => {
    const query = vi.fn();
    return {
        __esModule: true,
        default: {
            Pool: vi.fn(() => ({
                query
            }))
        },
        Pool: vi.fn(() => ({
            query
        }))
    };
});

describe('manage reservations page server', () => {
    let mockQuery: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockQuery = vi.mocked(Pool)().query;
    });

    describe('load function', () => {
        it('should return reservations list successfully', async () => {
            const mockReservations = [{
                ticket_id: '123',
                ticket_code: 'ABC123',
                username: 'testuser',
                movie_title: 'Test Movie',
                start_time: '2024-01-21T15:00:00Z',
                hall_name: 'Hall 1',
                seat_label: 'A1',
                price: 10.99,
                status: 'active',
                created_at: '2024-01-20T10:00:00Z'
            }];

            mockQuery.mockResolvedValueOnce({ rows: mockReservations });

            const result = await load();

            expect(result).toEqual({ reservations: mockReservations });
            expect(mockQuery).toHaveBeenCalledTimes(1);
            // Update the SQL query checks to match exactly
            const actualQuery = mockQuery.mock.calls[0][0];
            expect(actualQuery).toContain('SELECT\n    t.id AS ticket_id');
            expect(actualQuery).toContain('FROM\n    tickets t');
            expect(actualQuery).toContain('JOIN users u ON t.user_id = u.id');
            expect(actualQuery).toContain('ORDER BY\n    t.created_at DESC');
        });

        it('should handle database errors and return empty reservations array', async () => {
            mockQuery.mockRejectedValueOnce(new Error('Database error'));

            const result = await load();
            expect(result).toEqual({ reservations: [] });
            expect(mockQuery).toHaveBeenCalledTimes(1);
        });
    });

    describe('cancel action', () => {
        it('should successfully cancel a reservation', async () => {
            mockQuery.mockResolvedValueOnce({ rowCount: 1 });

            const formData = new FormData();
            formData.append('ticketId', '123');

            const result = await actions.cancel({
                request: new Request('http://localhost', {
                    method: 'POST',
                    body: formData
                })
            } as any);

            expect(result).toEqual({ success: true });
            expect(mockQuery).toHaveBeenCalledWith(
                'UPDATE tickets SET status = $1 WHERE id = $2',
                ['cancelled', '123']
            );
        });

        it('should handle cancellation errors', async () => {
            mockQuery.mockRejectedValueOnce(new Error('Database error'));

            const formData = new FormData();
            formData.append('ticketId', '123');

            const result = await actions.cancel({
                request: new Request('http://localhost', {
                    method: 'POST',
                    body: formData
                })
            } as any);

            expect(result).toEqual({ success: false });
            expect(mockQuery).toHaveBeenCalledTimes(1);
        });
    });
});
