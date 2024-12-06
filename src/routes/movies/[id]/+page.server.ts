import type { PageServerLoad } from './$types';
import 'dotenv/config';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const apiKey = process.env.VITE_OMDB_API_KEY; // api key noch aus der .env
	const { id } = params; // Die `id` wird aus der URL entnommen

	const response = await fetch(`https://www.omdbapi.com/?apikey=${apiKey}&i=${id}`);

	if (!response.ok) {
		throw new Error('Fehler beim Abrufen der Filmdetails.');
	}

	const data = await response.json();

	if (data.Response === 'False') {
		throw new Error(data.Error || 'Keine Filmdetails gefunden.');
	}

	return { movie: data }; // OMDb liefert die Filmdetails direkt
};
