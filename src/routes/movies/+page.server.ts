/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PageServerLoad } from './$types';
import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Type definitions for better type safety
interface Movie {
    id: string;
    Title: string;
    Year: string;
    Poster: string;
    nextScreening?: string;
    totalScreenings?: number;
}

export const load: PageServerLoad = async ({ fetch, url }) => {
    const apiKey = process.env.VITE_OMDB_API_KEY;
    const query = url.searchParams.get('query') || '';
    let movies: Movie[] = [];
    let error = null;

    try {
        const client = await pool.connect();
        
        // Get movie IDs from screenings table with additional information
        const screeningsQuery = `
            SELECT 
                movie_id,
                COUNT(*) as screening_count,
                MIN(start_time) as next_screening
            FROM screenings
            GROUP BY movie_id
        `;
        
        const res = await client.query(screeningsQuery);
        const availableMovies = res.rows;
        const availableMovieIds = availableMovies.map(row => row.movie_id);
        client.release();

        if (!query) {
            // Fetch details for all movies with scheduled screenings
            const omdbResponses = await Promise.all(
                availableMovieIds.map(id =>
                    fetch(`https://www.omdbapi.com/?apikey=${apiKey}&i=${id}&type=movie`)
                        .then(res => res.json())
                )
            );

            movies = omdbResponses
                .filter(movie => movie.Response !== 'False')
                .map(movie => {
                    const screeningInfo = availableMovies.find(
                        m => m.movie_id === movie.imdbID
                    );
                    
                    return {
                        id: movie.imdbID,
                        Title: movie.Title,
                        Year: movie.Year,
                        Poster: movie.Poster !== 'N/A' ? movie.Poster : 'default-fallback-image.png',
                        nextScreening: screeningInfo?.next_screening,
                        totalScreenings: screeningInfo?.screening_count
                    };
                });
        } else {
            // Search OMDB API
            const response = await fetch(
                `https://www.omdbapi.com/?apikey=${apiKey}&s=${query}&type=movie`
            );

            if (!response.ok) {
                throw new Error('Error fetching data from OMDB API.');
            }

            const data = await response.json();

            if (data.Response === 'False') {
                error = data.Error || 'No movies found.';
            } else {
                // Filter movies that have screenings and add screening information
                movies = data.Search
                    .filter((movie: { imdbID: string }) =>
                        availableMovieIds.includes(movie.imdbID)
                    )
                    .map((movie: any) => {
                        const screeningInfo = availableMovies.find(
                            m => m.movie_id === movie.imdbID
                        );
                        
                        return {
                            ...movie,
                            id: movie.imdbID,
                            nextScreening: screeningInfo?.next_screening,
                            totalScreenings: screeningInfo?.screening_count
                        };
                    });
            }
        }
    } catch (err) {
        console.error('Error:', err);
        error = 'An error occurred. Please try again later.';
    }

    return {
        movies,
        query,
        error
    };
};