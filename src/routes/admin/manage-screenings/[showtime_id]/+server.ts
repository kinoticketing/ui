import pkg from 'pg';
import type { RequestHandler } from '@sveltejs/kit';

const { Pool } = pkg;

const pool = new Pool({
	user: process.env.PGUSER,
	host: process.env.PGHOST,
	database: process.env.PGDATABASE,
	password: process.env.PGPASSWORD,
	port: 5432,
	ssl: { rejectUnauthorized: false }
});

// DELETE-Methode für das Löschen einer Vorstellung
export const DELETE: RequestHandler = async ({ params }) => {
	const { showtime_id } = params;

	try {
		await pool.query('DELETE FROM showtimes WHERE showtime_id = $1', [showtime_id]);
		return new Response(null, { status: 204 }); // Erfolgreich gelöscht
	} catch (error) {
		console.error('Fehler beim Löschen der Vorstellung:', error);
		return new Response('Fehler beim Löschen der Vorstellung', { status: 500 });
	}
};
