import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server';
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

// Mock environment variables
vi.mock('process', () => ({
    env: {
        VITE_OMDB_API_KEY: 'test-api-key',
        PGUSER: 'test-user',
        PGHOST: 'test-host',
        PGDATABASE: 'test-db',
        PGPASSWORD: 'test-password'
    }
}));

describe('save movie endpoint', () => {
    let mockQuery: any;
    let mockFetch: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockQuery = vi.mocked(Pool)().query;
        mockFetch = vi.fn();
        global.fetch = mockFetch;
    });

    it('should save new movie successfully', async () => {
        const movieData = {
            movie_id: 'tt1234567',
            title: 'Test Movie'
        };

        // Mock: Movie doesn't exist yet
        mockQuery.mockResolvedValueOnce({ rows: [] });

        // Mock OMDB API response
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                Response: "True",
                Title: "Test Movie",
                Year: "2024",
                Runtime: "120",
                Genre: "Action",
                Director: "Test Director",
                Actors: "Test Actor",
                Plot: "Test Plot",
                imdbRating: "8.5",
                Poster: "https://example.com/poster.jpg"
            })
        });

        // Mock successful database insert
        mockQuery.mockResolvedValueOnce({ rowCount: 1 });

        const response = await POST({
            request: new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify(movieData)
            })
        } as any);

        const result = await response.json();

        expect(result).toEqual({ success: true });
        expect(mockQuery).toHaveBeenCalledTimes(2);
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('https://www.omdbapi.com/')
        );
    });

    it('should skip saving if movie already exists', async () => {
        const movieData = {
            movie_id: 'tt1234567',
            title: 'Test Movie'
        };

        // Mock: Movie already exists
        mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

        const response = await POST({
            request: new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify(movieData)
            })
        } as any);

        const result = await response.json();

        expect(result).toEqual({ success: true });
        expect(mockQuery).toHaveBeenCalledTimes(1);
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle OMDB API errors', async () => {
        const movieData = {
            movie_id: 'tt1234567',
            title: 'Test Movie'
        };

        // Mock: Movie doesn't exist
        mockQuery.mockResolvedValueOnce({ rows: [] });

        // Mock OMDB API error
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            text: () => Promise.resolve('API Error')
        });

        const response = await POST({
            request: new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify(movieData)
            })
        } as any);

        const result = await response.json();

        expect(response.status).toBe(500);
        expect(result).toEqual({
            message: 'Error saving movie to database'
        });
    });

    it('should handle invalid movie data from OMDB', async () => {
        const movieData = {
            movie_id: 'tt1234567',
            title: 'Test Movie'
        };

        // Mock: Movie doesn't exist
        mockQuery.mockResolvedValueOnce({ rows: [] });

        // Mock invalid OMDB response
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                Response: "False",
                Error: "Movie not found!"
            })
        });

        const response = await POST({
            request: new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify(movieData)
            })
        } as any);

        const result = await response.json();

        expect(response.status).toBe(500);
        expect(result).toEqual({
            message: 'Error saving movie to database'
        });
    });

    it('should handle database errors', async () => {
        const movieData = {
            movie_id: 'tt1234567',
            title: 'Test Movie'
        };

        // Mock: Database error
        mockQuery.mockRejectedValueOnce(new Error('Database error'));

        const response = await POST({
            request: new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify(movieData)
            })
        } as any);

        const result = await response.json();

        expect(response.status).toBe(500);
        expect(result).toEqual({
            message: 'Error saving movie to database'
        });
    });
});
