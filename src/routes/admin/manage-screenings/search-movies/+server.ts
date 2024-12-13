import { json } from '@sveltejs/kit';

const OMDB_API_KEY = process.env.VITE_OMDB_API_KEY;

export async function GET({ url }) {
	const query = url.searchParams.get('query');
	if (!query) {
		return json({ movies: [], message: 'Suchbegriff fehlt.' });
	}

	try {
		const response = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(query)}`);
		const data = await response.json();

		if (data.Response === 'True') {
			const movies = data.Search.map((movie: any) => ({
				movie_id: movie.imdbID,
				title: movie.Title
			}));
			return json({ movies });
		} else {
			return json({ movies: [], message: data.Error || 'Keine Filme gefunden.' });
		}
	} catch (error) {
		console.error('Fehler bei der OMDB-Anfrage:', error);
		return json({ movies: [], message: 'Fehler bei der Anfrage zur OMDB-API.' });
	}
}
