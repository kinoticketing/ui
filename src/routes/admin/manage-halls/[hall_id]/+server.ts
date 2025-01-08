// src/routes/admin/manage-halls/[hall_id]/+server.ts
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

// DELETE-Methode für das Löschen eines Saals
export const DELETE: RequestHandler = async ({ params }) => {
	const { hall_id } = params;
	const id = Number(hall_id);

	try {
		// Reihenfolge:
		// 1) seats entfernen (ON DELETE CASCADE könnte man in der DB definieren)
		await pool.query('DELETE FROM seats WHERE hall_id = $1', [id]);

		// 2) hall selbst entfernen
		await pool.query('DELETE FROM halls WHERE id = $1', [id]);

		// HTTP 204: Erfolgreich ohne Content
		return new Response(null, { status: 204 });
	} catch (error) {
		console.error('Fehler beim Löschen des Saals:', error);
		return new Response('Fehler beim Löschen des Saals', { status: 500 });
	}
};
