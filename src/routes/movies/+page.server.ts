import type { PageServerLoad } from './$types';
import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

interface Movie {
	id: string;
	Title: string;
	Year: string;
	Genre: string;
	Director: string;
	Poster: string;
	Plot: string;
	imdbRating: string;
	nextScreening?: string;
}

export const load: PageServerLoad = async ({ fetch, url }) => {
	const apiKey = process.env.VITE_OMDB_API_KEY;
	const query = url.searchParams.get('query') || '';
	let movies: Movie[] = [];
	let error = null;

	try {
		const client = await pool.connect();

		// Base query to get upcoming screenings
		let screeningsQuery = `
            SELECT 
                movie_id,
                MIN(start_time) as next_screening
            FROM screenings
            WHERE start_time > NOW()
        `;

		// Add search conditions if query exists
		if (query) {
			screeningsQuery = `
                SELECT DISTINCT ON (s.movie_id)
                    s.movie_id,
                    MIN(s.start_time) as next_screening
                FROM screenings s
                JOIN movies m ON s.movie_id = m.id
                WHERE s.start_time > NOW()
                AND (
                    LOWER(m.title) LIKE $1 OR
                    LOWER(m.genre) LIKE $1 OR
                    LOWER(m.director) LIKE $1
                )
                GROUP BY s.movie_id
            `;
		}

		screeningsQuery += ' GROUP BY movie_id ORDER BY MIN(start_time)';

		const res = await client.query(screeningsQuery, query ? [`%${query.toLowerCase()}%`] : []);
		const upcomingMovies = res.rows;
		client.release();

		// Fetch movie details from OMDB
		const omdbResponses = await Promise.all(
			upcomingMovies.map((movie) =>
				fetch(
					`https://www.omdbapi.com/?apikey=${apiKey}&i=${movie.movie_id}&type=movie&plot=short`
				).then((res) => res.json())
			)
		);

		movies = omdbResponses
			.filter((movie) => movie.Response !== 'False')
			.map((movie, index) => ({
				id: movie.imdbID,
				Title: movie.Title,
				Year: movie.Year,
				Genre: movie.Genre,
				Director: movie.Director,
				Poster: movie.Poster !== 'N/A' ? movie.Poster : '/fallback-movie-poster.jpg',
				Plot: movie.Plot,
				imdbRating: movie.imdbRating,
				nextScreening: upcomingMovies[index].next_screening
			}))
			.sort((a, b) => {
				const dateA = new Date(a.nextScreening || '');
				const dateB = new Date(b.nextScreening || '');
				return dateA.getTime() - dateB.getTime();
			});
	} catch (err) {
		console.error('Error:', err);
		error = 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
	}

	return {
		movies,
		query,
		error
	};
};
