import type { PageServerLoad } from './$types';
import 'dotenv/config';
import pkg from 'pg';
const {Pool} = pkg;

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
});

export const load: PageServerLoad = async ({ fetch, url }) => {
	const apiKey = process.env.VITE_OMDB_API_KEY;
	const query = url.searchParams.get('query') || '';
	let movies: any[] = [];
	let error = null;

	try {
		// Abruf der movie_ids aus der Tabelle `showtimes`
		const client = await pool.connect();
		const res = await client.query('SELECT DISTINCT movie_id FROM showtimes');
		const availableMovieIds = res.rows.map((row) => row.movie_id);
		client.release();

		// Wenn keine Suchanfrage, alle Filme aus der Tabelle `showtimes` laden
		if (!query) {
			// Für jeden `movie_id` die Details aus OMDb abrufen
			const omdbResponses = await Promise.all(
				availableMovieIds.map((id) =>
					fetch(`https://www.omdbapi.com/?apikey=${apiKey}&i=${id}&type=movie`).then((res) => res.json())
				)
			);

			// Filme mit gültigen Daten hinzufügen
			movies = omdbResponses
				.filter((movie) => movie.Response !== 'False') // Nur gültige Filme
				.map((movie) => ({
					id: movie.imdbID,
					Title: movie.Title,
					Year: movie.Year,
					Poster: movie.Poster !== 'N/A' ? movie.Poster : 'default-fallback-image.png',
				}));
		} else {
			// OMDb API abfragen mit Such-Query
			const response = await fetch(`https://www.omdbapi.com/?apikey=${apiKey}&s=${query}&type=movie`);

			if (!response.ok) {
				throw new Error('Fehler beim Abrufen der Daten.');
			}

			const data = await response.json();

			if (data.Response === 'False') {
				error = data.Error || 'Keine Filme gefunden.';
			} else {
				// Filme filtern, die in der Tabelle `showtimes` existieren
				movies = data.Search.filter((movie: { imdbID: string }) =>
					availableMovieIds.includes(movie.imdbID)
				).map((movie: { imdbID: any }) => ({
					...movie,
					id: movie.imdbID,
				}));
			}
		}
	} catch (err) {
		error = 'Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.';
	}

	return { 
		movies,
		query,
		error
	};
};
