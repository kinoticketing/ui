// src/routes/movies/movies.server.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { load, type MoviesReturnData } from './+page.server'; 
//                                   ^ hier importieren wir MoviesReturnData

// Du mockst "pg" so, dass ein default-Export existiert (wegen import pkg from 'pg'):
vi.mock('pg', () => {
  const mockClient = {
    query: vi.fn().mockResolvedValue({ rows: [{ movie_id: 'tt1234567' }] }),
    release: vi.fn()
  };
  return {
    default: {
      Pool: vi.fn().mockImplementation(() => ({
        connect: vi.fn().mockResolvedValue(mockClient)
      }))
    }
  };
});

describe('movies.server load function', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    process.env.VITE_OMDB_API_KEY = 'TEST_API_KEY';
    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/testdb';
    mockFetch.mockClear();
  });

  async function callLoad(queryParam: string): Promise<MoviesReturnData> {
    const url = new URL('http://localhost:3000/movies');
    if (queryParam) url.searchParams.set('query', queryParam);

    const result = await load({ fetch: mockFetch, url } as any);
    // casten, damit TS weiß, dass es MoviesReturnData ist
    return result as MoviesReturnData;
  }

  it('returns movies if no query is provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        imdbID: 'tt1234567',
        Title: 'Hello World',
        Year: '2021',
        Poster: 'https://someposterurl.jpg',
        Response: 'True'
      })
    });

    const { movies, query, error } = await callLoad('');
    expect(error).toBeNull();
    expect(query).toBe('');
    expect(movies).toHaveLength(1);
    expect(movies[0].id).toBe('tt1234567');
  });
});
