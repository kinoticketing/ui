import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { load } from './+page.server';

// Variante A) Typ über ReturnType ableiten, ohne eigenes Interface:
type LoadReturn = Awaited<ReturnType<typeof load>>;

// Gemeinsame Mocks:
let mockFetch = vi.fn();

// Wir mocken 'pg' mit Default-Export, da in +page.server.ts `import pkg from 'pg'` verwendet wird.
vi.mock('pg', () => {
  return {
    default: {
      Pool: vi.fn().mockImplementation(() => ({
        connect: vi.fn().mockResolvedValue({
          query: vi.fn().mockResolvedValue({ rows: [{ movie_id: 'tt1234567' }] }),
          release: vi.fn()
        })
      }))
    }
  };
});

describe('movies.server load function', () => {
  // In jedem Test starten wir mit einer "Standard-DB" (1 Row) und "standard-Fetch"
  beforeEach(() => {
    process.env.VITE_OMDB_API_KEY = 'test-api-key'; 
    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/testdb';

    mockFetch = vi.fn(); // neu aufsetzen
  });

  afterEach(() => {
    vi.restoreAllMocks(); // Alles zurücksetzen
  });

  // Hilfsfunktion, um load() aufzurufen und den Rückgabetyp zu garantieren
  async function callLoad(queryParam: string): Promise<LoadReturn> {
    const url = new URL('http://localhost:3000/movies');
    if (queryParam) url.searchParams.set('query', queryParam);

    // Wir casten das Ergebnis auf LoadReturn, damit TS weiß, was zurückkommt.
    return (await load({ fetch: mockFetch, url } as any)) as LoadReturn;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 1) Standardfall: Keine Query => Lade alle Filme
  it('should return movies when no query is provided', async () => {
    // Standard-DB => 1 movie_id (tt1234567)
    // OMDb-Response mocken
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        imdbID: 'tt1234567',
        Title: 'Test Movie',
        Year: '2023',
        Poster: 'some-poster-url.jpg',
        Response: 'True'
      })
    });

    const { movies, query, error } = await callLoad('');

    expect(error).toBeNull();
    expect(query).toBe('');
    expect(movies).toHaveLength(1);
    expect(movies[0]).toMatchObject({
      id: 'tt1234567',
      Title: 'Test Movie',
      Year: '2023',
      Poster: 'some-poster-url.jpg'
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 2) Query vorhanden => Filtere Filme
  it('should handle a query and filter results that match available IDs', async () => {
    // Standard-DB => 1 movie_id (tt1234567)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        Response: 'True',
        Search: [
          { imdbID: 'tt1234567', Title: 'Batman Returns' },
          { imdbID: 'tt9876543', Title: 'Batman Forever' }
        ]
      })
    });

    const { movies, query, error } = await callLoad('Batman');

    expect(error).toBeNull();
    expect(query).toBe('Batman');
    // Nur tt1234567 ist in der "DB" => gefiltert
    expect(movies).toHaveLength(1);
    expect(movies[0].id).toBe('tt1234567');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 3) fetch ist nicht ok => Fehler
  it('should return an error if fetch is not ok', async () => {
    // OMDb liefert "ok: false"
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({})
    });

    const { error, movies } = await callLoad('SomeQuery');
    expect(error).toBe('Fehler beim Abrufen der Daten.');
    expect(movies).toHaveLength(0);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 4) Ausnahme (Netzwerkfehler/Timeout) => Catch-Block => Standard-Error
  it('should catch exceptions and return a fallback error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Fetch crashed'));

    const { error, movies } = await callLoad('ErrorQuery');
    expect(error).toBe('Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.');
    expect(movies).toHaveLength(0);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 5) Leere Datenbank
  it('should return an empty array if the DB has no movie_ids', async () => {
    // Wir ändern "pg" Mock, sodass 0 Rows zurückkommen
    const { default: pgDefault } = (await vi.importMock('pg')) as unknown as { default: { Pool: any } };
    pgDefault.Pool.mockImplementationOnce(() => ({
      connect: vi.fn().mockResolvedValue({
        query: vi.fn().mockResolvedValue({ rows: [] }), // <--- KEINE Einträge
        release: vi.fn()
      })
    }));

    // fetch wird gar nicht aufgerufen, weil es keine IDs gibt – wir können es abfangen
    // => "movies" müsste am Ende leer sein
    const { movies, error } = await callLoad('');
    expect(error).toBeNull();
    expect(movies).toHaveLength(0);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 6) Ungültiges OMDb-Response-Format
  it('should ignore invalid OMDb results (missing imdbID)', async () => {
    // DB => 1 movie_id: 'tt1234567'
    // OMDb liefert "Response: 'True'", aber das JSON hat kein "imdbID"
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        Title: 'Strange Movie',  // fehlendes imdbID
        Year: '2023',
        Poster: 'N/A',
        Response: 'True'
      })
    });

    const { movies, error } = await callLoad('');
    expect(error).toBeNull();
    // Du könntest erwarten, dass wir den Film nicht übernehmen, weil imdbID fehlt
    expect(movies).toHaveLength(0);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 7) Mehrere Filme in der DB => OMDb wird mehrfach abgefragt
  it('should process multiple DB rows', async () => {
    // Diesmal sind in der DB 2 Filme
    const { default: pgDefault } = (await vi.importMock('pg')) as unknown as { default: { Pool: any } };
    pgDefault.Pool.mockImplementationOnce(() => ({
      connect: vi.fn().mockResolvedValue({
        query: vi.fn().mockResolvedValue({
          rows: [
            { movie_id: 'tt1111111' },
            { movie_id: 'tt2222222' }
          ]
        }),
        release: vi.fn()
      })
    }));

    // Wir erwarten 2 fetch-Aufrufe
    // => 1. fetch (tt1111111)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        imdbID: 'tt1111111',
        Title: 'Movie 111',
        Year: '2020',
        Poster: 'some-poster.jpg',
        Response: 'True'
      })
    });
    // => 2. fetch (tt2222222)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        imdbID: 'tt2222222',
        Title: 'Movie 222',
        Year: '2021',
        Poster: 'N/A', // Fallback triggern
        Response: 'True'
      })
    });

    const { movies, error } = await callLoad('');
    expect(error).toBeNull();
    expect(movies).toHaveLength(2);
    expect(movies[0]).toMatchObject({
      id: 'tt1111111',
      Title: 'Movie 111',
      Year: '2020',
      Poster: 'some-poster.jpg'
    });
    expect(movies[1]).toMatchObject({
      id: 'tt2222222',
      Title: 'Movie 222',
      Year: '2021',
      Poster: 'default-fallback-image.png' // Poster war 'N/A'
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 8) Poster-Fallback => "N/A"
  it('should use the fallback poster if OMDb returns N/A', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        imdbID: 'tt1234567',
        Title: 'Fallback Test',
        Year: '2023',
        Poster: 'N/A', // hier
        Response: 'True'
      })
    });

    const { movies } = await callLoad('');
    expect(movies).toHaveLength(1);
    expect(movies[0].Poster).toBe('default-fallback-image.png');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 9) Teilweise OMDb-Fehler => z.B. "Search" hat 2 Filme, 1 davon Response:'False'
  //    (eigentlich liefert OMDb "Response" nur pro "search" request, 
  //     aber man kann simulieren gemischte Daten)
  it('should skip entries if OMDb says Response:false on them', async () => {
    // Hier simulieren wir: OMDb search => "Response: True", 
    //   aber eine Sub-Antwort (fiktiv) "Response: 'False'" 
    //   (In Wirklichkeit arbeitet OMDb ein bisschen anders, 
    //    man kann es aber so oder so ähnlich mocken.)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        Response: 'True',
        Search: [
          { imdbID: 'tt1234567', Response: 'False' },
          { imdbID: 'tt9876543', Response: 'True' }
        ]
      })
    });

    const { movies, query, error } = await callLoad('Something');
    expect(error).toBeNull();
    expect(query).toBe('Something');
    // Nur die "Response: 'True'"-Einträge übernehmen
    //   In deinem Code filterst du normalerweise anders. 
    //   Passe ggf. an, was "Response === 'False'" bedeutet.
    //   Das ist hier eher ein fiktives Beispiel.
    expect(movies).toHaveLength(1);
    expect(movies[0].id).toBe('tt9876543');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 10) Sonderzeichen in Query => "Guardians of the Galaxy: Vol. 3"
  it('should handle queries with special characters', async () => {
    // Normaler DB-Eintrag
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        Response: 'True',
        Search: [
          { imdbID: 'tt1234567', Title: 'Guardians of the Galaxy: Vol. 3' }
        ]
      })
    });

    const { movies, query, error } = await callLoad('Guardians of the Galaxy: Vol. 3');
    expect(error).toBeNull();
    // Die Query, inkl. Sonderzeichen, sollte in "query" drinstehen
    expect(query).toBe('Guardians of the Galaxy: Vol. 3');
    expect(movies).toHaveLength(1);
    expect(movies[0].Title).toBe('Guardians of the Galaxy: Vol. 3');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 11) Fehlende Env-Variable => OMDb kann nicht geladen werden
  it('should handle missing VITE_OMDB_API_KEY by failing fetch', async () => {
    delete process.env.VITE_OMDB_API_KEY; // Env-Key entfernen

    // fetch wird evtl. aufgerufen => wir können annehmen, es geht schief
    //   oder wir checken, ob dein Code damit klarkommt. 
    //   Du könntest z.B. `throw new Error(...)` oder `return { error: ... }`
    //   Hier simulieren wir, dass fetch auf eine "ungültige" URL geht oder 
    //   "ok: false" zurückkommt
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({})
    });

    const { error, movies } = await callLoad('');
    // Erwarte, dass dein Code eine Fehlermeldung ausgibt
    // (Hier hängt es davon ab, wie du den Fall "fehlender Key" abfängst)
    expect(error).toBe('Fehler beim Abrufen der Daten.');
    expect(movies).toHaveLength(0);
  });
});
