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

        // Check if movie already exists
        const existingMovie = await pool.query(
            'SELECT id FROM movies WHERE imdb_id = $1',
            [movie_id]
        );

        if (existingMovie.rows.length === 0) {
            // Movie doesn't exist, insert it with required fields
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
                    imdb_url
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                    movie_id,
                    title,
                    120, // default duration
                    2024, // default year
                    'Unknown', // default genre
                    'Unknown', // default director
                    'Unknown', // default actors
                    'No plot available', // default plot
                    0.0, // default rating
                    `https://www.imdb.com/title/${movie_id}` // constructed imdb_url
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