import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './+server';

describe('search movies endpoint', () => {
    let mockFetch: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch = vi.fn();
        global.fetch = mockFetch;
        process.env.VITE_OMDB_API_KEY = 'test-api-key';
    });

    it('should return empty array when no query provided', async () => {
        const url = new URL('http://localhost/search-movies');
        const response = await GET({ url } as any);
        const result = await response.json();

        expect(result).toEqual({
            movies: [],
            message: 'Suchbegriff fehlt.'
        });
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return movies when search is successful', async () => {
        const mockMovies = {
            Response: 'True',
            Search: [
                { imdbID: 'tt1234567', Title: 'Test Movie 1' },
                { imdbID: 'tt7654321', Title: 'Test Movie 2' }
            ]
        };

        mockFetch.mockResolvedValueOnce({
            json: () => Promise.resolve(mockMovies)
        });

        const url = new URL('http://localhost/search-movies?query=test');
        const response = await GET({ url } as any);
        const result = await response.json();

        expect(result).toEqual({
            movies: [
                { movie_id: 'tt1234567', title: 'Test Movie 1' },
                { movie_id: 'tt7654321', title: 'Test Movie 2' }
            ]
        });
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('https://www.omdbapi.com/')
        );
    });

    it('should handle no movies found', async () => {
        mockFetch.mockResolvedValueOnce({
            json: () => Promise.resolve({
                Response: 'False',
                Error: 'Movie not found!'
            })
        });

        const url = new URL('http://localhost/search-movies?query=nonexistent');
        const response = await GET({ url } as any);
        const result = await response.json();

        expect(result).toEqual({
            movies: [],
            message: 'Movie not found!'
        });
    });

    it('should handle API errors', async () => {
        mockFetch.mockRejectedValueOnce(new Error('API Error'));

        const url = new URL('http://localhost/search-movies?query=test');
        const response = await GET({ url } as any);
        const result = await response.json();

        expect(result).toEqual({
            movies: [],
            message: 'Fehler bei der Anfrage zur OMDB-API.'
        });
    });
});
