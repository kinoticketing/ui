import type { PageServerLoad } from './$types';
import 'dotenv/config';

export const load: PageServerLoad = async ({ fetch, url }) => {
	const apiKey = process.env.VITE_OMDB_API_KEY;
	const query = url.searchParams.get('query') || 'hangover';
	const maxResults = 50; // Anzahl der gewünschten Filme
	const moviesPerPage = 10; // OMDb gibt maximal 10 Filme pro Seite zurück
	const totalPages = Math.ceil(maxResults / moviesPerPage);

	let movies: any[] = [];
	let error = null;

	try {
		// Filme von mehreren Seiten abrufen
		for (let page = 1; page <= totalPages; page++) {
			const response = await fetch(`https://www.omdbapi.com/?apikey=${apiKey}&s=${query}&page=${page}`);

			if (!response.ok) {
				throw new Error('Fehler beim Abrufen der Daten.');
			}

			const data = await response.json();

			if (data.Response === 'False') {
				error = data.Error || 'Keine Filme gefunden.';
				break;
			}

			movies = movies.concat(
				data.Search.map((movie: { imdbID: any }) => ({ ...movie, id: movie.imdbID }))
			);

			// Abbrechen, wenn weniger als 10 Ergebnisse auf der letzten Seite zurückkommen
			if (data.Search.length < moviesPerPage) {
				break;
			}
		}
	} catch (err) {
		error = 'Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.';
	}

	return { 
		movies: movies.slice(0, maxResults), // Beschränkung auf maxResults
		query,
		error
	};
};