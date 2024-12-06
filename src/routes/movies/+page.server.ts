import type { PageServerLoad } from './$types';
import 'dotenv/config';

export const load: PageServerLoad = async ({ fetch }) => {
	const apiKey = process.env.VITE_OMDB_API_KEY; // api key aktuell noch aus der .env
	const query = 'hangover'; // Beispiel-Query
	const response = await fetch(`https://www.omdbapi.com/?apikey=${apiKey}&s=${query}`);

	if (!response.ok) {
		throw new Error('Fehler beim Abrufen der Daten.');
	}

	const data = await response.json();

	if (data.Response === 'False') {
		throw new Error(data.Error || 'Keine Filme gefunden.');
	}

	//   return { movies: data.Search }; // OMDB liefert die Filme unter `Search`
	return { movies: data.Search.map((movie: { imdbID: any }) => ({ ...movie, id: movie.imdbID })) };
};
