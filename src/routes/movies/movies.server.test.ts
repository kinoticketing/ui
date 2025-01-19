import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { load } from './+page.server';
import { Pool } from 'pg';


interface Movie {
    id: string;
    Title: string;
    Year: string;
    Poster: string;
    nextScreening?: string;
    totalScreenings?: number;
}

// Mock the pg Pool with default export
vi.mock('pg', async () => {
    const Pool = vi.fn(() => ({
        connect: () => ({
            query: vi.fn().mockResolvedValue({
                rows: [
                    { movie_id: 'tt1234567' },
                    { movie_id: 'tt7654321' }
                ]
            }),
            release: vi.fn()
        })
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
process.env.DATABASE_URL = 'mock-db-url';

describe('load function', () => {
    let mockFetch: any;

    beforeEach(() => {
        // Reset fetch mock before each test
        mockFetch = vi.fn();
        global.fetch = mockFetch;
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch all movies when no query is provided', async () => {
        mockFetch.mockImplementation((url: string) => {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    imdbID: url.includes('tt1234567') ? 'tt1234567' : 'tt7654321',
                    Title: url.includes('tt1234567') ? 'Movie 1' : 'Movie 2',
                    Year: '2023',
                    Poster: 'https://example.com/poster.jpg',
                    Response: 'True'
                })
            });
        });

        const url = new URL('http://example.com');
        const result = await load({ fetch: mockFetch, url } as any) as { movies: Movie[] };
        
        expect(result.movies).toHaveLength(2);
        expect(result.movies[0]).toMatchObject({
            id: expect.any(String),
            Title: expect.any(String),
            Year: expect.any(String),
            Poster: expect.any(String)
        });
    });

    it('should handle search query and filter available movies', async () => {
        // Reset all mocks before setting up new ones
        vi.resetAllMocks();
        
        // Create a properly typed mock pool
        const mockPoolInstance = {
            connect: () => ({
                query: vi.fn().mockResolvedValue({
                    rows: [
                        { movie_id: 'tt1234567', next_screening: '2024-01-20T10:00:00Z' }
                    ]
                }),
                release: vi.fn()
            }),
            // Add required Pool properties
            totalCount: 0,
            idleCount: 0,
            waitingCount: 0,
            end: vi.fn(),
            on: vi.fn(),
            removeAllListeners: vi.fn()
        } as unknown as Pool;

        vi.mocked(Pool).mockImplementation(() => mockPoolInstance);

        // Mock fetch to return only one movie
        mockFetch.mockImplementation((url: string) => {
            if (url.includes('tt1234567')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        Response: 'True',
                        Title: 'Test Movie',
                        Year: '2023',
                        Poster: 'https://example.com/poster.jpg',
                        imdbID: 'tt1234567',
                        Genre: 'Action',
                        Director: 'Test Director',
                        Plot: 'Test Plot',
                        imdbRating: '8.0'
                    })
                });
            }
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    Response: 'False'
                })
            });
        });

        const url = new URL('http://example.com?query=test');
        const result = await load({ fetch: mockFetch, url } as any) as { movies: Movie[] };
        
        expect(result.movies).toHaveLength(1);
        expect(result.movies[0]).toMatchObject({
            id: 'tt1234567',
            Title: 'Test Movie',
            Year: '2023',
            Poster: 'https://example.com/poster.jpg'
        });
    });

    it('should handle API errors gracefully', async () => {
        mockFetch.mockImplementation(() =>
            Promise.resolve({
                ok: false,
                status: 500
            })
        );
    
        const url = new URL('http://example.com?query=test');
        const result = await load({ fetch: mockFetch, url } as any) as { movies: Movie[], error?: string };
        
        expect(result.movies).toHaveLength(0);
        expect(result.error).toBe('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    });
    
    it('should handle no movies found response', async () => {
        // Mock pool for empty results
        const mockPool = {
            connect: () => ({
                query: vi.fn().mockResolvedValue({
                    rows: []
                }),
                release: vi.fn()
            })
        };

        // Mock the Pool constructor to return our mock pool
        vi.mocked(Pool).mockImplementation(() => mockPool as any);

        mockFetch.mockImplementation(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    Response: 'False',
                    Error: 'Movie not found!'
                })
            })
        );

        const url = new URL('http://example.com?query=nonexistent');
        const result = await load({ fetch: mockFetch, url } as any) as { movies: Movie[], error?: string };
        
        expect(result.movies).toHaveLength(0);
        expect(result.movies).toEqual([]);
    });
});