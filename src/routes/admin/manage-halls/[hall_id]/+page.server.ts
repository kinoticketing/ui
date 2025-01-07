// src/routes/admin/manage-halls/[hall_id]/+page.server.ts
import type { PageServerLoad, Actions } from './$types';
import type { RequestEvent } from '@sveltejs/kit';
import pkg from 'pg';
const { Pool } = pkg;

// Deinen Pool erstellen oder importieren
const pool = new Pool({
	user: process.env.PGUSER,
	host: process.env.PGHOST,
	database: process.env.PGDATABASE,
	password: process.env.PGPASSWORD,
	port: 5432,
	ssl: {
		rejectUnauthorized: false
	}
});

export const load: PageServerLoad = async ({ params }) => {
	try {
		// hole die hall_id aus den URL-Parametern (z. B. /admin/manage-halls/7)
		const hallId = parseInt(params.hall_id, 10);

		// Saal aus der Datenbank laden
		const result = await pool.query(
			/* 
			 * Wir holen hier alle Felder (hall_id, name, capacity, seat_plan).
			 * 'seat_plan' enthält dein Sitzplan-Layout. 
			 */
			'SELECT hall_id, name, capacity, seat_plan FROM cinema_halls WHERE hall_id = $1',
			[hallId]
		);


		if (result.rowCount === 0) {
			// Falls kein Saal mit dieser ID existiert
			return {
				hall: null,
				error: `Saal mit ID ${hallId} nicht gefunden`
			};
		}

        console.log('DB result:', result.rows[0]);

		const hall = result.rows[0];

		// Optional: Falls seat_plan als JSON gespeichert ist und du es direkt parsen möchtest
		let seatPlan;
		try {
			seatPlan = JSON.parse(hall.seat_plan);
		} catch (err) {
			console.warn('seat_plan ist möglicherweise kein gültiges JSON', err);
			seatPlan = hall.seat_plan; // oder null
		}

		return {
			hall: {
				hall_id: hall.hall_id,
				name: hall.name,
				capacity: hall.capacity,
				seat_plan: seatPlan
			}
		};
	} catch (error) {
		console.error('Fehler beim Laden des Saals:', error);
		return {
			hall: null,
			error: 'Datenbankfehler beim Laden des Saals.'
		};
	}
};

// Beispiel-Aktionen: DELETE oder UPDATE (Sitzplan ändern etc.)
export const actions: Actions = {
	delete: async ({ params }: RequestEvent) => {
		const { hall_id } = params as { hall_id: string };
		try {
			await pool.query('DELETE FROM cinema_halls WHERE hall_id = $1', [hall_id]);
			return { success: true };
		} catch (error) {
			console.error('Fehler beim Löschen des Saals:', error);
			return { success: false, error: 'Datenbankfehler beim Löschen des Saals.' };
		}
	},

	updateSeatPlan: async ({ request, params }: RequestEvent) => {
		const { hall_id } = params as { hall_id: string };
		const formData = await request.formData();
		// z. B. das neue seat_plan (als JSON) aus einem Form-Feld "new_seat_plan" auslesen
		const newSeatPlan = formData.get('new_seat_plan')?.toString();

		if (!newSeatPlan) {
			return { success: false, error: 'Kein Sitzplan angegeben' };
		}

		try {
			// Schreib den neuen Sitzplan als JSON in die DB
			await pool.query(
				'UPDATE cinema_halls SET seat_plan = $1 WHERE hall_id = $2',
				[newSeatPlan, hall_id]
			);
			return { success: true };
		} catch (error) {
			console.error('Fehler beim Aktualisieren des Sitzplans:', error);
			return { success: false, error: 'Datenbankfehler beim Aktualisieren des Sitzplans.' };
		}
	}
};
