// src/routes/admin/manage-screenings/[screening_id]/+page.server.ts
import type { PageServerLoad, Actions } from './$types';
import { error } from '@sveltejs/kit';
import pkg from 'pg';
const { Pool } = pkg;

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
		const screeningId = parseInt(params.screening_id, 10);
		if (isNaN(screeningId)) {
			throw error(400, 'Ungültige screening_id');
		}

		// 1) Screening (Vorstellung) + zugehörigen Hall (Saal) laden
		const screeningResult = await pool.query(
			`
			SELECT
				s.id AS screening_id,
				s.movie_id,
				s.hall_id,
				s.start_time,
				s.end_time,
				h.name AS hall_name,
				h.total_rows,
				h.total_columns
			FROM screenings s
			JOIN halls h ON h.id = s.hall_id
			WHERE s.id = $1
			`,
			[screeningId]
		);

		if (screeningResult.rowCount === 0) {
			throw error(404, `Vorstellung (screening) mit ID ${screeningId} nicht gefunden`);
		}

		const row = screeningResult.rows[0];

		// Initialize seat plan as a 2D-array of nulls (als Platzhalter)
		const seatPlan: any[][] = Array(row.total_rows)
			.fill(null)
			.map(() => Array(row.total_columns).fill(null));

		// 2) Seats laden – hier holen wir zusätzlich category_id und Kategorie-Name (als category)
		const seatsResult = await pool.query(
			`
            SELECT
                row_number - 1 AS row_index,
                column_number - 1 AS col_index,
                seat_label,
                status,
                category_id,
                COALESCE(sc.name, 'regular') AS category,
                COALESCE(sc.price_modifier, 1) AS price_modifier
            FROM seats
            LEFT JOIN seat_categories sc ON seats.category_id = sc.id
            WHERE hall_id = $1
            ORDER BY row_number, column_number
            `,
			[row.hall_id]
		);

		// 3) Sitzplan-Array füllen – an der korrekten Stelle wird statt eines simplen Strings ein Objekt abgelegt
		seatsResult.rows.forEach((seat) => {
			if (
				seat.row_index >= 0 &&
				seat.row_index < row.total_rows &&
				seat.col_index >= 0 &&
				seat.col_index < row.total_columns
			) {
				seatPlan[seat.row_index][seat.col_index] = {
					label: seat.seat_label,
					status: seat.status,
					category: seat.category,
					category_id: seat.category_id,
					priceModifier: seat.price_modifier
				};
			}
		});

		// 4) Dem Frontend ein Objekt zurückgeben, das "wie früher" aufgebaut ist
		const capacity = seatPlan.flat().filter(seat => seat !== null).length;
		return {
			screening: {
				screening_id: row.screening_id,
				movie_id: row.movie_id,
				hall_id: row.hall_id,
				hall_name: row.hall_name,
				start_time: row.start_time,
				end_time: row.end_time,
				capacity,
				seat_plan: seatPlan
			}
		};
	} catch (err) {
		console.error('Fehler im load:', err);
		throw error(500, 'Datenbankfehler beim Laden der Vorstellung');
	}
};

export const actions: Actions = {
	delete: async ({ params }) => {
		/*
			Wenn du eine Vorstellung löschen möchtest:
			DELETE FROM screenings WHERE id = ...
		*/
		const screeningId = parseInt(params.screening_id, 10);
		try {
			await pool.query('DELETE FROM screenings WHERE id = $1', [screeningId]);
			return { success: true };
		} catch (err) {
			console.error('Fehler beim Löschen der Vorstellung:', err);
			return { success: false, error: 'Datenbankfehler beim Löschen' };
		}
	},

	updateSeatPlan: async ({ params, request }) => {
		/*
			Da dein aktuelles DB-Schema keinen direkten Sitzplan als Feld bereitstellt,
			müssen wir – analog zur "Update seats"-Logik – alle Seats löschen und neu erstellen.
		*/
		const screeningId = parseInt(params.screening_id, 10);
		const formData = await request.formData();
		const newSeatPlanStr = formData.get('new_seat_plan');

		if (!newSeatPlanStr) {
			return { success: false, error: 'Kein Sitzplan übergeben.' };
		}

		try {
			// 1) Screening laden, um die hall_id zu ermitteln
			const screeningResult = await pool.query(
				'SELECT hall_id, total_rows, total_columns FROM screenings WHERE id = $1',
				[screeningId]
			);
			if (screeningResult.rowCount === 0) {
				return { success: false, error: 'Screening nicht gefunden.' };
			}
			const { hall_id, total_rows, total_columns } = screeningResult.rows[0];

			// 2) Alle existing seats für diesen Hall löschen
			await pool.query('DELETE FROM seats WHERE hall_id = $1', [hall_id]);

			// 3) Neuen Sitzplan einlesen und alle seats neu anlegen
			//    Erwartet wird ein 2D-Array, in dem jede Zelle ein Objekt mit mindestens { label, status, category_id } ist.
			const seatPlanArray = JSON.parse(newSeatPlanStr.toString()) as any[][];

			// Optional: Hier kannst du noch Validierungen (z.B. Dimensionen) vornehmen
			for (let r = 0; r < seatPlanArray.length; r++) {
				for (let c = 0; c < seatPlanArray[r].length; c++) {
					const seatObj = seatPlanArray[r][c];
					// Falls in einer Zelle kein Objekt vorhanden ist, erzeugen wir einen Default-Wert (z. B. "regular")
					const label =
						seatObj && seatObj.label
							? seatObj.label
							: `${String.fromCharCode(65 + r)}${c + 1}`;
					const status = seatObj && seatObj.status ? seatObj.status : 'active';
					// category_id kann entweder explizit übergeben werden oder auf null/default gesetzt werden
					const category_id =
						seatObj && seatObj.category_id ? seatObj.category_id : null;

					// Da in der DB Zeilen und Spalten in der Regel 1-basiert sind, speichern wir r+1 und c+1
					await pool.query(
						`
						INSERT INTO seats (hall_id, row_number, column_number, seat_label, status, category_id)
						VALUES ($1, $2, $3, $4, $5, $6)
						`,
						[hall_id, r + 1, c + 1, label, status, category_id]
					);
				}
			}

			return { success: true };
		} catch (err) {
			console.error('Fehler beim Aktualisieren des Sitzplans:', err);
			return { success: false, error: 'Datenbankfehler beim Aktualisieren des Sitzplans' };
		}
	}
};
