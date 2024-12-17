import type { PageServerLoad } from './$types';
import pkg from 'pg';
const { Client } = pkg;
import 'dotenv/config';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const apiKey = process.env.VITE_OMDB_API_KEY;
	const { id } = params;

	// Filmdetails abrufen
	const response = await fetch(`https://www.omdbapi.com/?apikey=${apiKey}&i=${id}`);

	if (!response.ok) {
		throw new Error('Fehler beim Abrufen der Filmdetails.');
	}

	const data = await response.json();

	if (data.Response === 'False') {
		throw new Error(data.Error || 'Keine Filmdetails gefunden.');
	}

	// Datenbankverbindung erstellen
	const client = new Client({
		host: process.env.DB_HOST,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
		port: 5432, // PostgreSQL Standard-Port
		ssl: {
			rejectUnauthorized: false
		}
	});

	await client.connect();

	// Vorstellungen abrufen
	const res = await client.query(
		'SELECT showtime AS time, hall_id AS hall FROM showtimes WHERE movie_id = $1',
		[id]
	);

	await client.end();

	return {
		movie: data,
		showtimes: res.rows // Vorstellungen zurückgeben
	};
};
