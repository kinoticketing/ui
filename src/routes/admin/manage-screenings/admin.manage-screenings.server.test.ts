import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load } from './+page.server';
import { Pool } from 'pg';

// Add type definition for the load function return
type LoadReturn = {
    showtimes: Array<{
        showtime_id: number;
        movie_id: string;
        movie_title: string;
        movie_poster_url: string;
        hall_name: string;
        showtime: string;
        end_time: string;
        total_seats: number;
        reserved_seats: number;
        occupancy_percentage: number;
    }>;
};

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

describe('manage screenings page server', () => {
    let mockQuery: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockQuery = vi.mocked(Pool)().query;
    });

    describe('load function', () => {
        it('should return screenings list successfully', async () => {
            const mockScreenings = [{
                showtime_id: 1,
                movie_id: 'tt1234567',
                movie_title: 'Test Movie',
                movie_poster_url: 'http://example.com/poster.jpg',
                hall_name: 'Hall 1',
                showtime: '2024-02-01T10:00:00Z',
                end_time: '2024-02-01T12:00:00Z',
                total_seats: 100,
                reserved_seats: 50,
                occupancy_percentage: 50
            }];

            mockQuery.mockResolvedValueOnce({ rows: mockScreenings });

            const result = await load({
                url: new URL('http://localhost'),
                params: {},
                route: { id: '' }
            } as any) as LoadReturn;  // Add type assertion here

            expect(result).toEqual({ showtimes: mockScreenings });
            expect(mockQuery).toHaveBeenCalledTimes(1);
            expect(mockQuery.mock.calls[0][0]).toContain('SELECT');
            expect(mockQuery.mock.calls[0][0]).toContain('FROM screenings s');
            expect(mockQuery.mock.calls[0][0]).toContain('ORDER BY s.start_time ASC');
        });

        it('should handle database errors and return empty showtimes array', async () => {
            mockQuery.mockRejectedValueOnce(new Error('Database error'));

            const result = await load({
                url: new URL('http://localhost'),
                params: {},
                route: { id: '' }
            } as any) as LoadReturn;  // Add type assertion here

            expect(result).toEqual({ showtimes: [] });
            expect(mockQuery).toHaveBeenCalledTimes(1);
        });

        it('should calculate occupancy percentage correctly', async () => {
            const mockScreenings = [{
                showtime_id: 1,
                movie_id: 'tt1234567',
                movie_title: 'Test Movie',
                movie_poster_url: 'http://example.com/poster.jpg',
                hall_name: 'Hall 1',
                showtime: '2024-02-01T10:00:00Z',
                end_time: '2024-02-01T12:00:00Z',
                total_seats: '100',  // Note: comes as string from database
                reserved_seats: '25', // Note: comes as string from database
            }];

            mockQuery.mockResolvedValueOnce({ rows: mockScreenings });

            const result = await load({
                url: new URL('http://localhost'),
                params: {},
                route: { id: '' }
            } as any) as LoadReturn;  // Add type assertion here

            expect(result.showtimes[0].occupancy_percentage).toBe(25);
            expect(result.showtimes[0].total_seats).toBe(100);
            expect(result.showtimes[0].reserved_seats).toBe(25);
        });

        it('should handle zero total seats without error', async () => {
            const mockScreenings = [{
                showtime_id: 1,
                movie_id: 'tt1234567',
                movie_title: 'Test Movie',
                movie_poster_url: 'http://example.com/poster.jpg',
                hall_name: 'Hall 1',
                showtime: '2024-02-01T10:00:00Z',
                end_time: '2024-02-01T12:00:00Z',
                total_seats: '0',
                reserved_seats: '0',
            }];

            mockQuery.mockResolvedValueOnce({ rows: mockScreenings });

            const result = await load({
                url: new URL('http://localhost'),
                params: {},
                route: { id: '' }
            } as any) as LoadReturn;  // Add type assertion here

            expect(result.showtimes[0].occupancy_percentage).toBe(0);
            expect(result.showtimes[0].total_seats).toBe(0);
            expect(result.showtimes[0].reserved_seats).toBe(0);
        });
    });
});
