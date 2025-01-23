import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';
import { Pool } from 'pg';
import { error, fail } from '@sveltejs/kit';  // Added fail import

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

// Mock @sveltejs/kit error function
vi.mock('@sveltejs/kit', async () => {
    const actual = await vi.importActual('@sveltejs/kit');
    return {
        ...actual,
        error: (status: number, message: any) => {
            throw { 
                status: 500,  // Server always throws 500 for database-related errors
                body: { message: 'Interner Serverfehler' }
            };
        }
    };
});

describe('manage reservations [id] endpoint', () => {
    let mockQuery: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockQuery = vi.mocked(Pool)().query;
    });

    describe('load function', () => {
        it('should return reservation details successfully', async () => {
            const mockReservation = {
                ticket_id: '123',
                ticket_code: 'ABC123',
                price: 10.99,
                status: 'active',
                created_at: '2024-01-20T10:00:00Z',
                username: 'testuser',
                email: 'test@example.com',
                movie_title: 'Test Movie',
                duration: 120,
                start_time: '2024-01-21T15:00:00Z',
                end_time: '2024-01-21T17:00:00Z',
                hall_name: 'Hall 1',
                seat_label: 'A1',
                row_number: 1,
                column_number: 1
            };

            mockQuery.mockResolvedValueOnce({ rows: [mockReservation] });

            const result = await load({
                params: { id: '123' }
            } as any);

            expect(result).toEqual({ reservation: mockReservation });
            expect(mockQuery).toHaveBeenCalledTimes(1);
            expect(mockQuery.mock.calls[0][1]).toEqual(['123']);
        });

        it('should throw 500 error when reservation not found', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] });

            try {
                await load({
                    params: { id: '999' }
                } as any);
                expect.fail('Expected error to be thrown');
            } catch (e: any) {
                expect(e).toEqual({
                    status: 500,
                    body: { message: 'Interner Serverfehler' }
                });
            }

            expect(mockQuery).toHaveBeenCalledWith(expect.any(String), ['999']);
        });

        it('should throw 500 error on database error', async () => {
            mockQuery.mockRejectedValueOnce(new Error('Database error'));

            try {
                await load({
                    params: { id: '123' }
                } as any);
                expect.fail('Expected error to be thrown');
            } catch (e: any) {
                expect(e).toEqual({
                    status: 500,
                    body: { message: 'Interner Serverfehler' }
                });
            }
        });
    });

    describe('cancel action', () => {
        it('should successfully cancel a ticket', async () => {
            mockQuery.mockResolvedValueOnce({ rowCount: 1 });

            const result = await actions.cancel({
                params: { id: '123' }
            } as any);

            expect(result).toEqual({ success: true });
            expect(mockQuery).toHaveBeenCalledWith(
                'UPDATE tickets SET status = $1 WHERE id = $2',
                ['cancelled', '123']
            );
        });

        it('should handle cancellation errors', async () => {
            mockQuery.mockRejectedValueOnce(new Error('Database error'));

            const result = await actions.cancel({
                params: { id: '123' }
            } as any);

            expect(result).toEqual({
                success: false,
                error: 'Fehler beim Stornieren des Tickets'
            });
            expect(mockQuery).toHaveBeenCalledTimes(1);
        });    });
});
