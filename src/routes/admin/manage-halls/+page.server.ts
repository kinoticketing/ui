import pkg from 'pg';
const { Pool } = pkg;
import type { RequestEvent } from '@sveltejs/kit';

const pool = new Pool({
	user: process.env.PGUSER,
	host: process.env.PGHOST,
	database: process.env.PGDATABASE,
	password: process.env.PGPASSWORD,
	port: 5432,
	ssl: {
		rejectUnauthorized: false // SSL aktivieren und unsignierte Zertifikate zulassen
	}
});

export async function load() {
	try {
		// Daten aus der Tabelle `halls` laden und Aliase nutzen
		// für hall_id und capacity, damit das Frontend unverändert bleiben kann.
		const query = `
			SELECT 
				id AS hall_id,
				name,
				(SELECT COUNT(*) FROM seats WHERE hall_id = halls.id) AS capacity
			FROM halls
			ORDER BY name
		`;

		const result = await pool.query(query);

		return { halls: result.rows };
	} catch (error) {
		console.error('Fehler beim Laden der Säle:', error);
		return { halls: [] };
	}
}

export const actions = {
	delete: async ({ params }: RequestEvent) => {
		const { hall_id } = params as { hall_id: string };
		try {
			// Löschen des Saals anhand des Primärschlüssels 'id' in der neuen Tabelle 'halls'
			await pool.query('DELETE FROM halls WHERE id = $1', [hall_id]);

			return { success: true };
		} catch (error) {
			console.error('Fehler beim Löschen des Saals:', error);
			return { success: false };
		}
	}
};
