import { json } from '@sveltejs/kit';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: 5432,
    ssl: { rejectUnauthorized: false }
});

export async function POST({ request }) {
    try {
        const { movie_id, title } = await request.json();
        const apiKey = process.env.VITE_OMDB_API_KEY;

        // Check if movie already exists
        const existingMovie = await pool.query(
            'SELECT id FROM movies WHERE imdb_id = $1',
            [movie_id]
        );

        if (existingMovie.rows.length === 0) {
            const omdbUrl = `https://www.omdbapi.com/?apikey=${apiKey}&i=${movie_id}&plot=full`;

            // Fetch detailed movie data from OMDB
            const omdbResponse = await fetch(omdbUrl);
            
            
            if (!omdbResponse.ok) {
                const errorText = await omdbResponse.text();
                console.error('OMDB Error response:', errorText);
                throw new Error(`Failed to fetch movie data from OMDB: ${omdbResponse.status} ${errorText}`);
            }

            const movieData = await omdbResponse.json();

            if (movieData.Response === "False") {
                throw new Error(movieData.Error || 'Movie not found');
            }

            // Parse and format movie data
            const duration = parseInt(movieData.Runtime) || 120;
            const year = parseInt(movieData.Year) || 2024;
            const imdb_rating = parseFloat(movieData.imdbRating) || 0.0;

            // Insert movie into database
            await pool.query(
                `INSERT INTO movies (
                    imdb_id,
                    title,
                    duration,
                    year,
                    genre,
                    director,
                    actors,
                    plot,
                    imdb_rating,
                    imdb_url,
                    poster_url
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [
                    movie_id,
                    movieData.Title || title,
                    duration,
                    year,
                    movieData.Genre || 'Unknown',
                    movieData.Director || 'Unknown',
                    movieData.Actors || 'Unknown',
                    movieData.Plot || 'No plot available',
                    imdb_rating,
                    `https://www.imdb.com/title/${movie_id}`,
                    movieData.Poster !== 'N/A' ? movieData.Poster : null
                ]
            );
        }

        return json({ success: true });
    } catch (error) {
        console.error('Error saving movie:', error);
        return json(
            { message: 'Error saving movie to database' },
            { status: 500 }
        );
    }
}