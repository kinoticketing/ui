import pkg from 'pg';
const {Pool} = pkg;
import type { RequestEvent } from '@sveltejs/kit';

const pool = new Pool({
	user: process.env.PGUSER,
	host: process.env.PGHOST,
	database: process.env.PGDATABASE,
	password: process.env.PGPASSWORD,
	port: 5432,
    ssl: {
        rejectUnauthorized: false // SSL aktivieren und unsignierte Zertifikate zulassen
    },
});

export async function load() {
	try {
		// Daten aus der Tabelle `cinema_halls` laden
		const result = await pool.query('SELECT hall_id, name, capacity FROM cinema_halls ORDER BY name');
		return { halls: result.rows };
	} catch (error) {
		console.error('Fehler beim Laden der Säle:', error);
		return { halls: [] }; // Rückgabe eines leeren Arrays bei Fehler
	}
}

export const actions = {
	delete: async ({ params }: RequestEvent) => {
		// Sicherstellen, dass hall_id vorhanden ist
		const { hall_id } = params as { hall_id: string };
		try {
			await pool.query('DELETE FROM cinema_halls WHERE hall_id = $1', [hall_id]);
			return { success: true };
		} catch (error) {
			console.error('Fehler beim Löschen des Saals:', error);
			return { success: false };
		}
	}
};
