/* eslint-disable @typescript-eslint/no-explicit-any */
// src/routes/api/movies/[id]/trailer/+server.ts
import { TMDB_API_KEY } from '$env/static/private';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

async function getTMDBId(imdbId: string) {
	const response = await fetch(
		`https://api.themoviedb.org/3/find/${imdbId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`
	);
	const data = await response.json();
	return data.movie_results[0]?.id;
}

async function getTrailer(tmdbId: number) {
	const response = await fetch(
		`https://api.themoviedb.org/3/movie/${tmdbId}/videos?api_key=${TMDB_API_KEY}`
	);
	const data = await response.json();
	// Find the official trailer, preferably in German since your site is in German
	const trailer =
		data.results.find(
			(video: any) =>
				video.type === 'Trailer' &&
				video.site === 'YouTube' &&
				video.official &&
				video.language === 'de'
		) ||
		// Fallback to any official trailer if no German one exists
		data.results.find(
			(video: any) => video.type === 'Trailer' && video.site === 'YouTube' && video.official
		);
	return trailer?.key; // YouTube video ID
}

export const GET: RequestHandler = async ({ params }) => {
	try {
		const imdbId = params.id;
		const tmdbId = await getTMDBId(imdbId);

		if (!tmdbId) {
			throw error(404, 'Movie not found on TMDB');
		}

		const trailerId = await getTrailer(tmdbId);

		if (!trailerId) {
			throw error(404, 'No trailer found');
		}

		return new Response(JSON.stringify({ trailerId }));
	} catch (e) {
		console.error('Error fetching trailer:', e);
		throw error(500, 'Failed to fetch trailer');
	}
};
