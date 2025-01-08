// src/routes/admin/manage-screenings/[screening_id]/+server.ts
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
	const { screening_id } = params;
	const id = screening_id ? parseInt(screening_id, 10) : NaN;

	try {
		// Evtl. erst seat_reservations löschen, wenn du das nicht per ON DELETE CASCADE geregelt hast
		await pool.query('DELETE FROM seat_reservations WHERE screening_id = $1', [id]);

		// Jetzt die eigentliche Vorstellung löschen
		await pool.query('DELETE FROM screenings WHERE id = $1', [id]);

		return new Response(null, { status: 204 }); // Erfolgreich gelöscht
	} catch (error) {
		console.error('Fehler beim Löschen der Vorstellung:', error);
		return new Response('Fehler beim Löschen der Vorstellung', { status: 500 });
	}
};
