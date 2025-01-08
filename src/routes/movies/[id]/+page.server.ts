// src/routes/movies/[id]/+page.server.ts
import type { PageServerLoad } from './$types';
import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const apiKey = process.env.VITE_OMDB_API_KEY;
	const { id } = params; // z.B. "tt1320253"

	// 1) Filmdetails von OMDb abrufen
	const response = await fetch(`https://www.omdbapi.com/?apikey=${apiKey}&i=${id}`);
	if (!response.ok) {
		throw new Error('Fehler beim Abrufen der Filmdetails.');
	}
	const data = await response.json();
	if (data.Response === 'False') {
		throw new Error(data.Error || 'Keine Filmdetails gefunden.');
	}

	// 2) DB-Verbindung
	const pool = new Pool({
		user: process.env.DB_USER,
		host: process.env.DB_HOST,
		database: process.env.DB_NAME,
		password: process.env.DB_PASSWORD,
		port: 5432,
		ssl: {
			rejectUnauthorized: false
		}
	});

	// 3) Alle SCREENINGS zu diesem Film (movie_id = id) holen
	const res = await pool.query(
		`
		SELECT 
			id,        -- PK
			hall_id,   -- FK zu halls
			start_time
		FROM screenings
		WHERE movie_id = $1
		ORDER BY start_time
		`,
		[id]
	);

	// 4) Pool freigeben
	await pool.end();

	// 5) Wir wollen im Frontend ein Array "showtimes" haben:
	const showtimes = res.rows.map((row) => {
		return {
			id: row.id,              // screening.id
			time: row.start_time,    // => "time" fürs Frontend
			hall: row.hall_id        // => "hall"
		};
	});

	return {
		movie: {
			...data, // sämtliche OMDb-Felder wie Title, Year, usw.
			id       // wir geben die IMDb-ID als "movie.id" zurück
		},
		showtimes
	};
};
