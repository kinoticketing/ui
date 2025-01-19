import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load } from './+page.server';
import { Pool } from 'pg';
import type { PageServerLoad } from './$types';

interface LoadResult {
    movies: Array<{
        id: string;
        Title: string;
        Year: string;
        Genre: string;
        Director: string;
        Poster: string;
        Plot: string;
        imdbRating: string;
        nextScreening?: string;
    }>;
    query: string;
    error: string | null;
}

// Mock the pg Pool
vi.mock('pg', () => {
    const mockConnect = vi.fn(() => ({
        query: vi.fn(),
        release: vi.fn()
    }));
    return {
        __esModule: true,
        default: {
            Pool: vi.fn(() => ({
                connect: mockConnect
            }))
        },
        Pool: vi.fn(() => ({
            connect: mockConnect
        }))
    };
});

describe('root page server', () => {
    let mockConnect: any;
    let mockClient: any;
    let mockFetch: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockClient = {
            query: vi.fn(),
            release: vi.fn()
        };
        mockConnect = vi.mocked(Pool)().connect;
        mockConnect.mockResolvedValue(mockClient);
        mockFetch = vi.fn();
        vi.stubEnv('VITE_OMDB_API_KEY', 'test-api-key');
    });

    it('should load upcoming movies successfully', async () => {
        const mockScreenings = [
            { movie_id: 'tt1234', next_screening: '2024-02-01T10:00:00Z' },
            { movie_id: 'tt5678', next_screening: '2024-02-01T14:00:00Z' }
        ];

        const mockMovies = [
            {
                imdbID: 'tt1234',
                Title: 'Test Movie 1',
                Year: '2024',
                Genre: 'Action',
                Director: 'Director 1',
                Poster: 'https://example.com/poster1.jpg',
                Plot: 'Plot 1',
                imdbRating: '8.5',
                Response: 'True'
            },
            {
                imdbID: 'tt5678',
                Title: 'Test Movie 2',
                Year: '2024',
                Genre: 'Drama',
                Director: 'Director 2',
                Poster: 'https://example.com/poster2.jpg',
                Plot: 'Plot 2',
                imdbRating: '7.5',
                Response: 'True'
            }
        ];

        mockClient.query.mockResolvedValueOnce({ rows: mockScreenings });
        mockFetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockMovies[0]) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockMovies[1]) });

        const result = (await load({
            fetch: mockFetch,
            url: new URL('http://localhost')
        } as any)) as LoadResult;

        expect(result.movies).toHaveLength(2);
        expect(result.movies[0]).toMatchObject({
            id: 'tt1234',
            Title: 'Test Movie 1',
            nextScreening: mockScreenings[0].next_screening
        });
        expect(result.error).toBeNull();
        expect(mockClient.release).toHaveBeenCalled();
    });

    it('should filter movies by search query', async () => {
        const mockScreenings = [
            { movie_id: 'tt1234', next_screening: '2024-02-01T10:00:00Z' },
            { movie_id: 'tt5678', next_screening: '2024-02-01T14:00:00Z' }
        ];

        mockClient.query.mockResolvedValueOnce({ rows: mockScreenings });
        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    Response: 'True',
                    imdbID: 'tt1234',
                    Title: 'Action Movie',
                    Year: '2024',
                    Genre: 'Action',
                    Director: 'Director 1',
                    Poster: 'https://example.com/poster1.jpg',
                    Plot: 'Plot 1',
                    imdbRating: '8.5'
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    Response: 'True',
                    imdbID: 'tt5678',
                    Title: 'Drama Movie',
                    Year: '2024',
                    Genre: 'Drama',
                    Director: 'Director 2',
                    Poster: 'https://example.com/poster2.jpg',
                    Plot: 'Plot 2',
                    imdbRating: '7.5'
                })
            });

        const result = (await load({
            fetch: mockFetch,
            url: new URL('http://localhost?query=action')
        } as any)) as LoadResult;

        expect(result.movies).toHaveLength(1);
        expect(result.movies[0].Title).toBe('Action Movie');
        expect(result.query).toBe('action');
    });

    it('should handle database errors', async () => {
        mockClient.query.mockRejectedValueOnce(new Error('Database error'));

        const result = (await load({
            fetch: mockFetch,
            url: new URL('http://localhost')
        } as any)) as LoadResult;

        expect(result.movies).toEqual([]);
        expect(result.error).toBe('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    });

    it('should handle OMDB API errors', async () => {
        mockClient.query.mockResolvedValueOnce({
            rows: [{ movie_id: 'tt1234', next_screening: '2024-02-01T10:00:00Z' }]
        });

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ Response: 'False' })
        });

        const result = (await load({
            fetch: mockFetch,
            url: new URL('http://localhost')
        } as any)) as LoadResult;

        expect(result.movies).toEqual([]);
        expect(result.error).toBeNull();
    });

    it('should handle invalid poster URLs', async () => {
        mockClient.query.mockResolvedValueOnce({
            rows: [{ movie_id: 'tt1234', next_screening: '2024-02-01T10:00:00Z' }]
        });

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                Response: 'True',
                imdbID: 'tt1234',
                Title: 'Test Movie',
                Year: '2024',
                Genre: 'Action',
                Director: 'Director',
                Poster: 'N/A',
                Plot: 'Plot',
                imdbRating: '8.5'
            })
        });

        const result = (await load({
            fetch: mockFetch,
            url: new URL('http://localhost')
        } as any)) as LoadResult;

        expect(result.movies[0].Poster).toBe('/fallback-image.jpg');
    });
});
