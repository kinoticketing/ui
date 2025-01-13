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

		 // Initialize seat plan with correct dimensions
        const seatPlan: string[][] = Array(row.total_rows)
            .fill(null)
            .map(() => Array(row.total_columns).fill(''));

        // Load seats with 1-based indexing
        const seatsResult = await pool.query(`
            SELECT
                row_number - 1 as row_index,
                column_number - 1 as col_index,
                seat_label,
                status
            FROM seats
            WHERE hall_id = $1
            ORDER BY row_number, column_number
        `, [row.hall_id]);

        // Safely populate seat plan
        seatsResult.rows.forEach(seat => {
            if (seat.row_index >= 0 && 
                seat.row_index < row.total_rows && 
                seat.col_index >= 0 && 
                seat.col_index < row.total_columns) {
                seatPlan[seat.row_index][seat.col_index] = seat.seat_label;
            }
        });

		// 4) Dem Frontend ein Objekt zurückgeben, das "wie früher" aufgebaut ist
		return {
			screening: {
				screening_id: row.screening_id,
				movie_id: row.movie_id,
				hall_id: row.hall_id,
				hall_name: row.hall_name,
				start_time: row.start_time,
				end_time: row.end_time,
				capacity: row.total_rows * row.total_columns,
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
			Da dein neues DB-Schema kein seat_plan-Feld in `screenings` oder `halls` hat,
			müsstest du - analog zur "Update seats"-Logik - 
			entweder seats neu anlegen, löschen oder ändern.

			Hier nur ein rudimentäres Beispiel: 
			Aktuell würden wir alle seats löschen & dann neu erstellen.
		*/
		const screeningId = parseInt(params.screening_id, 10);
		const formData = await request.formData();
		const newSeatPlanStr = formData.get('new_seat_plan');

		if (!newSeatPlanStr) {
			return { success: false, error: 'Kein Sitzplan übergeben.' };
		}

		try {
			// 1) Screening laden, um hall_id zu bekommen
			const screeningResult = await pool.query(
				'SELECT hall_id FROM screenings WHERE id = $1',
				[screeningId]
			);
			if (screeningResult.rowCount === 0) {
				return { success: false, error: 'Screening nicht gefunden.' };
			}
			const hallId = screeningResult.rows[0].hall_id;

			// 2) Seats für diesen hall löschen
			await pool.query('DELETE FROM seats WHERE hall_id = $1', [hallId]);

			// 3) Neue seats anlegen
			const seatPlanArray = JSON.parse(newSeatPlanStr.toString()) as string[][];

			for (let r = 0; r < seatPlanArray.length; r++) {
				for (let c = 0; c < seatPlanArray[r].length; c++) {
					const label = seatPlanArray[r][c] || '';
					// In status könntest du z.B. 'active' speichern
					const status = 'active';

					await pool.query(
						`
						INSERT INTO seats (hall_id, row_number, column_number, seat_label, status)
						VALUES ($1, $2, $3, $4, $5)
						`,
						[hallId, r, c, label, status]
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
