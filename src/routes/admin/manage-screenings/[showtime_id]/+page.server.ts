// src/routes/admin/manage-screenings/[showtime_id]/+page.server.ts
import type { PageServerLoad, Actions } from './$types';
import pkg from 'pg';
const { Pool } = pkg;
import { error } from '@sveltejs/kit';

const pool = new Pool({
	user: process.env.PGUSER,
	host: process.env.PGHOST,
	database: process.env.PGDATABASE,
	password: process.env.PGPASSWORD,
	port: 5432,
	ssl: { rejectUnauthorized: false }
});

export const load: PageServerLoad = async ({ params }) => {
	try {
		const showtimeId = parseInt(params.showtime_id, 10);
		if (isNaN(showtimeId)) {
			throw error(400, 'Ungültige showtime_id');
		}

		// Wir laden die Daten aus der Tabelle showtimes.
		// Wenn du zusätzlich den Saal (cinema_halls) joinst, bekommst du
		// auch seat_plan und hall_name.
		// Pseudocode (Passe Felder an dein Schema an):
		const result = await pool.query(
			`
			SELECT 
				s.showtime_id,
				s.movie_id,
				s.hall_id,
				s.showtime,
				c.name AS hall_name,
				c.capacity,
				c.seat_plan
			FROM showtimes s
			JOIN cinema_halls c ON c.hall_id = s.hall_id
			WHERE s.showtime_id = $1
		`,
			[showtimeId]
		);

		if (result.rowCount === 0) {
			throw error(404, `Vorstellung mit ID ${showtimeId} nicht gefunden`);
		}

		const row = result.rows[0];

		// seat_plan könnte bereits ein Array/Objekt sein, oder ein String. Prüfen:
		let parsedSeatPlan = row.seat_plan;
		if (typeof parsedSeatPlan === 'string') {
			try {
				parsedSeatPlan = JSON.parse(parsedSeatPlan);
			} catch (err) {
				console.warn('Fehler beim JSON-Parse von seat_plan:', err);
				parsedSeatPlan = null;
			}
		}

		return {
			screening: {
				showtime_id: row.showtime_id,
				movie_id: row.movie_id,
				hall_id: row.hall_id,
				showtime: row.showtime, // evtl. Datum/Uhrzeit
				hall_name: row.hall_name,
				capacity: row.capacity,
				seat_plan: parsedSeatPlan
			}
		};
	} catch (err) {
		console.error('Fehler im load:', err);
		throw error(500, 'Datenbankfehler beim Laden der Vorstellung');
	}
};

// Optional: Actions, z. B. zum Löschen, Bearbeiten etc.
export const actions: Actions = {
	delete: async ({ params }) => {
		const showtimeId = parseInt(params.showtime_id, 10);
		try {
			await pool.query('DELETE FROM showtimes WHERE showtime_id = $1', [showtimeId]);
			return { success: true };
		} catch (err) {
			console.error('Fehler beim Löschen der Vorstellung:', err);
			return { success: false, error: 'Datenbankfehler beim Löschen' };
		}
	},

	updateSeatPlan: async ({ params, request }) => {
		const showtimeId = parseInt(params.showtime_id, 10);
		const formData = await request.formData();
		const newSeatPlan = formData.get('new_seat_plan');

		if (!newSeatPlan) {
			return { success: false, error: 'Kein Sitzplan übergeben.' };
		}

		try {
			// Hier updatest du den seat_plan in der cinema_halls-Tabelle
			// (falls du das pro Vorstellung anders speichern willst, müsstest du dein Schema anpassen)
			await pool.query(
				'UPDATE cinema_halls SET seat_plan = $1 WHERE hall_id = (SELECT hall_id FROM showtimes WHERE showtime_id = $2)',
				[newSeatPlan, showtimeId]
			);
			return { success: true };
		} catch (err) {
			console.error('Fehler beim Aktualisieren des Sitzplans:', err);
			return { success: false, error: 'Datenbankfehler beim Aktualisieren des Sitzplans' };
		}
	}
};
