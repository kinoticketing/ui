import type { PageServerLoad, Actions } from './$types';
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

export const load: PageServerLoad = async ({ params }) => {
	try {
		const hallId = Number(params.hall_id);

		// Load hall data (ohne total_columns)
		const hallResult = await pool.query(
			`
            SELECT id, name, total_rows
            FROM halls 
            WHERE id = $1
            `,
			[hallId]
		);

		if (hallResult.rowCount === 0) {
			return { hall: null, error: `Hall with ID ${hallId} not found` };
		}

		const hallRow = hallResult.rows[0];

		// Lade Sitze gruppiert nach Reihen und zähle die Sitze pro Reihe
		const seatsResult = await pool.query(
			`
            SELECT 
                s.row_number,
                s.column_number,
                s.seat_label,
                s.status,
                s.category_id,
                sc.name as category_name,
                sc.price_modifier,
                COUNT(*) OVER (PARTITION BY s.row_number) as seats_in_row
            FROM seats s
            LEFT JOIN seat_categories sc ON s.category_id = sc.id
            WHERE s.hall_id = $1
            ORDER BY s.row_number, s.column_number
            `,
			[hallId]
		);

		// Erstelle ein Object mit der Anzahl Sitze pro Reihe
		const rowSizes = seatsResult.rows.reduce((acc, seat) => {
			acc[seat.row_number] = seat.seats_in_row;
			return acc;
		}, {});

		// Erstelle den Sitzplan basierend auf den tatsächlichen Sitzen
		const seatPlan = [];
		for (let rowNum = 1; rowNum <= hallRow.total_rows; rowNum++) {
			const rowSeats = seatsResult.rows
				.filter((seat) => seat.row_number === rowNum)
				.map((seat) => ({
					label: seat.seat_label,
					status: seat.status,
					category: seat.category_name,
					category_id: seat.category_id,
					priceModifier: seat.price_modifier
				}));

			if (rowSeats.length > 0) {
				seatPlan.push(rowSeats);
			}
		}

		return {
			hall: {
				id: hallRow.id,
				name: hallRow.name,
				total_rows: hallRow.total_rows,
				seat_plan: seatPlan,
				total_seats: seatsResult.rowCount,
				row_sizes: rowSizes // Falls du die Information über die Größe jeder Reihe brauchst
			}
		};
	} catch (error) {
		console.error('Error loading hall:', error);
		return { hall: null, error: 'Failed to load hall data' };
	}
};
