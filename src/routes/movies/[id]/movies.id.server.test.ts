import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { load } from './+page.server';

// Define interfaces for type safety
interface Showtime {
    id: number;
    hall: string;
    time: string;
}

interface MovieDetails {
    Title: string;
    Year?: string;
    Plot?: string;
    Response: string;
    id: string;
}

interface PageData {
    movie: MovieDetails;
    showtimes: Showtime[];
}

// Mock the pg Pool
vi.mock('pg', async () => {
    const Pool = vi.fn(() => ({
        query: vi.fn().mockResolvedValue({
            rows: [
                {
                    id: 1,
                    hall_id: 'HALL1',
                    start_time: '2024-01-20T18:00:00Z'
                },
                {
                    id: 2,
                    hall_id: 'HALL2',
                    start_time: '2024-01-20T20:00:00Z'
                }
            ]
        }),
        end: vi.fn()
    }));
    return {
        default: {
            Pool
        },
        Pool
    };
});

// Mock environment variables
vi.mock('dotenv/config', () => ({}));
process.env.VITE_OMDB_API_KEY = 'test-api-key';
process.env.DB_USER = 'test-user';
process.env.DB_HOST = 'test-host';
process.env.DB_NAME = 'test-db';
process.env.DB_PASSWORD = 'test-password';

describe('Movie Detail Page Load', () => {
    let mockFetch: any;

    beforeEach(() => {
        mockFetch = vi.fn();
        global.fetch = mockFetch;
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch movie details and screenings successfully', async () => {
        const movieId = 'tt1234567';
        const mockMovieData = {
            Title: 'Test Movie',
            Year: '2023',
            Plot: 'A test movie plot',
            Response: 'True'
        };

        mockFetch.mockImplementation(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockMovieData)
            })
        );

        const result = await load({
            params: { id: movieId },
            fetch: mockFetch
        } as any) as PageData;

        // Verify movie details
        expect(result.movie).toMatchObject({
            ...mockMovieData,
            id: movieId
        });

        // Verify showtimes
        expect(result.showtimes).toHaveLength(2);
        expect(result.showtimes[0]).toMatchObject({
            id: 1,
            hall: 'HALL1',
            time: '2024-01-20T18:00:00Z'
        });
    });

    it('should handle OMDB API errors', async () => {
        mockFetch.mockImplementation(() =>
            Promise.resolve({
                ok: false,
                status: 500
            })
        );

        await expect(load({
            params: { id: 'tt1234567' },
            fetch: mockFetch
        } as any)).rejects.toThrow('Fehler beim Abrufen der Filmdetails.');
    });

    it('should handle movie not found response', async () => {
        mockFetch.mockImplementation(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    Response: 'False',
                    Error: 'Movie not found!'
                })
            })
        );

        await expect(load({
            params: { id: 'tt1234567' },
            fetch: mockFetch
        } as any)).rejects.toThrow('Movie not found!');
    });

    it('should format showtimes correctly', async () => {
        mockFetch.mockImplementation(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    Title: 'Test Movie',
                    Response: 'True'
                })
            })
        );

        const result = await load({
            params: { id: 'tt1234567' },
            fetch: mockFetch
        } as any) as PageData;

        expect(result.showtimes).toEqual([
            {
                id: 1,
                hall: 'HALL1',
                time: '2024-01-20T18:00:00Z'
            },
            {
                id: 2,
                hall: 'HALL2',
                time: '2024-01-20T20:00:00Z'
            }
        ]);
    });
});