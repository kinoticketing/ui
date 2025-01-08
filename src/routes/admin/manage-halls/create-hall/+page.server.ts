import { fail } from '@sveltejs/kit';
import pkg from 'pg';
const { Pool } = pkg;

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

export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const hall_name = formData.get('hall_name');
		const row_count = formData.get('row_count');
		const col_count = formData.get('col_count');
		const seat_plan = formData.get('seat_plan');

		// Validierung
		if (!hall_name || !row_count || !col_count || !seat_plan) {
			return fail(400, { message: 'Fehlende Daten' });
		}

		try {
			/*
			 1) In 'halls' eintragen
			 id = PK
			*/
			const insertHallQuery = `
				INSERT INTO halls (name, total_rows, total_columns)
				VALUES ($1, $2, $3)
				RETURNING id
			`;
			const hallResult = await pool.query(insertHallQuery, [
				hall_name,
				Number(row_count),
				Number(col_count)
			]);
			const hallId = hallResult.rows[0].id;

			/*
			 2) Sitzplan aus dem Formular (JSON) in 'seats' ablegen (optional)
			*/
			const seatPlanArray = JSON.parse(seat_plan as string); // z.B. [["Regular","VIP"],["Regular","Regular"]]

			for (let r = 0; r < seatPlanArray.length; r++) {
				for (let c = 0; c < seatPlanArray[r].length; c++) {
					// Beispiel: Label = "A1", "A2"...
					const seatLabel = String.fromCharCode(65 + r) + (c + 1);
					const status = 'active'; 
					// oder: seatPlanArray[r][c] => in status oder seat_type

					await pool.query(`
						INSERT INTO seats (
							hall_id,
							row_number,
							column_number,
							seat_label,
							status
						) VALUES ($1, $2, $3, $4, $5)
					`, [
						hallId,
						r,
						c,
						seatLabel,
						status
					]);
				}
			}

			return {
				success: true,
				message: 'Saal erfolgreich gespeichert!',
				hall_id: hallId
			};
		} catch (error) {
			console.error('Fehler beim Speichern:', error);
			return fail(500, { message: 'Fehler beim Speichern' });
		}
	}
};
