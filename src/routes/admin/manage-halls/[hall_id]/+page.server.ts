// src/routes/admin/manage-halls/[hall_id]/+page.server.ts
import type { PageServerLoad, Actions } from './$types';
import pkg from 'pg';
const { Pool } = pkg;

// Pool erstellen
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
		const hallId = Number(params.hall_id);

		// 1) Hallen-Daten aus `halls` laden
		const hallResult = await pool.query(
			`
			SELECT 
				id, 
				name, 
				total_rows, 
				total_columns
			FROM halls
			WHERE id = $1
			`,
			[hallId]
		);

		if (hallResult.rowCount === 0) {
			return {
				hall: null,
				error: `Saal mit ID ${hallId} nicht gefunden`
			};
		}

		const hallRow = hallResult.rows[0];
		// Zur Info: capacity können wir dynamisch berechnen
		const capacity = hallRow.total_rows * hallRow.total_columns;

		// 2) Seats zu diesem Saal laden und in ein 2D-Array packen
		const seatsResult = await pool.query(
			`
			SELECT 
				row_number, 
				column_number,
				seat_label,
				status
			FROM seats
			WHERE hall_id = $1
			ORDER BY row_number, column_number
			`,
			[hallId]
		);

		/*
		 * 3) seat_plan als 2D-Array erstellen
		 *    row_number und column_number gehen jeweils von 0..(n-1).
		 *    Du kannst in seat_plan z.B. die seat_label oder status hinterlegen.
		 */
		const seatPlan: string[][] = [];

		for (let r = 0; r < hallRow.total_rows; r++) {
			seatPlan[r] = [];
			for (let c = 0; c < hallRow.total_columns; c++) {
				seatPlan[r][c] = ''; // Erst mal leer
			}
		}

		// Die Daten aus seatsResult eintragen
		for (const seat of seatsResult.rows) {
			// Hier entscheidest du, was im Frontend angezeigt werden soll:
			// seat.seat_label (z.B. 'A1') oder seat.status (z.B. 'active', 'VIP', etc.)
			// In diesem Beispiel nehmen wir seat_label.
			seatPlan[seat.row_number][seat.column_number] = seat.seat_label;
		}

		const hallData = {
			hall_id: hallRow.id,
			name: hallRow.name,
			capacity,
			seat_plan: seatPlan
		};

		return {
			hall: hallData
		};
	} catch (error) {
		console.error('Fehler beim Laden des Saals:', error);
		return {
			hall: null,
			error: 'Datenbankfehler beim Laden des Saals.'
		};
	}
};

// Aktionen (z.B. Saal aktualisieren) – optional
export const actions: Actions = {
	// Beispiel: Sitzplan aktualisieren (komplett oder teilweise)
	// Das Prinzip wäre:
	// 1) parse seat_plan
	// 2) seats löschen/aktualisieren oder upsert
	// 3) done
	// Der Einfachheit halber hier ein Pseudobeispiel:

	updateSeatPlan: async ({ request, params }) => {
		const hallId = Number(params.hall_id);
		const formData = await request.formData();
		const newSeatPlan = formData.get('new_seat_plan')?.toString();

		if (!newSeatPlan) {
			return { success: false, error: 'Kein neuer Sitzplan angegeben.' };
		}

		try {
			// 1) Parse JSON
			const seatPlanArray = JSON.parse(newSeatPlan) as string[][];

			// 2) Lösche zuerst alle seats für diese hallId
			await pool.query('DELETE FROM seats WHERE hall_id = $1', [hallId]);

			// 3) Neu anlegen
			for (let r = 0; r < seatPlanArray.length; r++) {
				for (let c = 0; c < seatPlanArray[r].length; c++) {
					const label = seatPlanArray[r][c] || '';
					// 'active' oder was immer du willst
					const status = 'active';

					await pool.query(
						`
						INSERT INTO seats (
							hall_id,
							row_number,
							column_number,
							seat_label,
							status
						) VALUES ($1, $2, $3, $4, $5)
						`,
						[hallId, r, c, label, status]
					);
				}
			}

			return { success: true };
		} catch (error) {
			console.error('Fehler beim Aktualisieren des Sitzplans:', error);
			return { success: false, error: 'Fehler beim Aktualisieren des Sitzplans.' };
		}
	}
};
