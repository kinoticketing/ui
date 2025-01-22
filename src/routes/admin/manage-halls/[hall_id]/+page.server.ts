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

		// Load hall data
		const hallResult = await pool.query(
			`
            SELECT id, name, total_rows, total_columns
            FROM halls 
            WHERE id = $1
        `,
			[hallId]
		);

		if (hallResult.rowCount === 0) {
			return { hall: null, error: `Hall with ID ${hallId} not found` };
		}

		const hallRow = hallResult.rows[0];

		// Load seats with their categories
		const seatsResult = await pool.query(
			`
            SELECT 
                s.row_number,
                s.column_number,
                s.seat_label,
                s.status,
                s.category_id,
                sc.name as category_name,
                sc.price_modifier
            FROM seats s
            LEFT JOIN seat_categories sc ON s.category_id = sc.id
            WHERE s.hall_id = $1
            ORDER BY s.row_number, s.column_number
        `,
			[hallId]
		);

		// Create seat plan array
		const seatPlan = Array(hallRow.total_rows)
			.fill(null)
			.map(() => Array(hallRow.total_columns).fill(null));

		// Fill seat plan with actual seat data
		seatsResult.rows.forEach((seat) => {
			seatPlan[seat.row_number - 1][seat.column_number - 1] = {
				label: seat.seat_label,
				status: seat.status,
				category: seat.category_name,
				category_id: seat.category_id,
				priceModifier: seat.price_modifier
			};
		});

		return {
			hall: {
				id: hallRow.id,
				name: hallRow.name,
				total_rows: hallRow.total_rows,
				total_columns: hallRow.total_columns,
				total_seats: seatsResult.rowCount,
				seat_plan: seatPlan
			}
		};
	} catch (error) {
		console.error('Error loading hall:', error);
		return { hall: null, error: 'Failed to load hall data' };
	}
};