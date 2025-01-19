import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './+server';
import { error } from '@sveltejs/kit';

// Mock fetch
global.fetch = vi.fn();

// Mock environment variable
vi.mock('$env/static/private', () => ({
    TMDB_API_KEY: 'mock-api-key-123'
}));

// Update error mock
vi.mock('@sveltejs/kit', () => ({
    error: (status: number, message: string) => {
        const err = new Error(message);
        (err as any).status = status;
        (err as any).body = { message };
        throw err;
    }
}));

describe('Movie Trailer API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch trailer successfully', async () => {
        const mockTMDBResponse = {
            movie_results: [{
                id: 12345
            }]
        };

        const mockTrailerResponse = {
            results: [{
                key: 'xyz789',
                type: 'Trailer',
                site: 'YouTube',
                official: true,
                language: 'de'
            }]
        };

        vi.mocked(fetch)
            .mockResolvedValueOnce({
                json: () => Promise.resolve(mockTMDBResponse),
                ok: true
            } as any)
            .mockResolvedValueOnce({
                json: () => Promise.resolve(mockTrailerResponse),
                ok: true
            } as any);

        const response = await GET({
            params: { id: 'tt1234567' }
        } as any);

        const result = await response.json();
        expect(result).toEqual({ trailerId: 'xyz789' });
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('mock-api-key-123'));
    });

    it('should handle movie not found on TMDB', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            json: () => Promise.resolve({ movie_results: [] }),
            ok: true
        } as any);

        try {
            await GET({
                params: { id: 'tt9999999' }
            } as any);
            expect.fail('Expected error to be thrown');
        } catch (e: any) {
            expect(e.status).toBe(500); // Server always throws 500 for errors
            expect(e.body.message).toBe('Failed to fetch trailer');
        }
    });

    it('should handle no trailer available', async () => {
        vi.mocked(fetch)
            .mockResolvedValueOnce({
                json: () => Promise.resolve({ 
                    movie_results: [{ id: 12345 }] 
                }),
                ok: true
            } as any)
            .mockResolvedValueOnce({
                json: () => Promise.resolve({ results: [] }),
                ok: true
            } as any);

        try {
            await GET({
                params: { id: 'tt1234567' }
            } as any);
            expect.fail('Expected error to be thrown');
        } catch (e: any) {
            expect(e.status).toBe(500); // Server always throws 500 for errors
            expect(e.body.message).toBe('Failed to fetch trailer');
        }
    });

    it('should prefer German trailers', async () => {
        const mockTMDBResponse = {
            movie_results: [{ id: 12345 }]
        };

        const mockTrailerResponse = {
            results: [
                {
                    key: 'eng123',
                    type: 'Trailer',
                    site: 'YouTube',
                    official: true,
                    language: 'en'
                },
                {
                    key: 'deu456',
                    type: 'Trailer',
                    site: 'YouTube',
                    official: true,
                    language: 'de'
                }
            ]
        };

        vi.mocked(fetch)
            .mockResolvedValueOnce({
                json: () => Promise.resolve(mockTMDBResponse),
                ok: true
            } as any)
            .mockResolvedValueOnce({
                json: () => Promise.resolve(mockTrailerResponse),
                ok: true
            } as any);

        const response = await GET({
            params: { id: 'tt1234567' }
        } as any);

        const result = await response.json();
        expect(result).toEqual({ trailerId: 'deu456' });
    });

    it('should handle TMDB API errors', async () => {
        vi.mocked(fetch).mockRejectedValueOnce(new Error('API Error'));

        try {
            await GET({
                params: { id: 'tt1234567' }
            } as any);
            expect(true).toBe(false); // Should not reach here
        } catch (e: any) {
            expect(e.status).toBe(500);
            expect(e.body.message).toBe('Failed to fetch trailer');
        }
    });
});
