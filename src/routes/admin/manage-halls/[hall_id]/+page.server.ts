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
    SELECT
    h.id,
    h.name,
    h.total_rows,
    h.total_columns,
    COUNT(s.id) as total_seats
    FROM halls h
    LEFT JOIN seats s ON h.id = s.hall_id
    WHERE h.id = $1
    GROUP BY h.id, h.name, h.total_rows, h.total_columns
    `,
			[hallId]
		);

		if (hallResult.rowCount === 0) {
			return {
				hall: null,
				error: `Hall with ID ${hallId} not found`
			};
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
    sc.name as category_name,
    sc.price_modifier
    FROM seats s
    LEFT JOIN seat_categories sc ON s.category_id = sc.id
    WHERE s.hall_id = $1
    ORDER BY s.row_number, s.column_number
    `,
			[hallId]
		);

		// Initialize seat plan with the maximum dimensions found in the data
		const maxRow = Math.max(hallRow.total_rows - 1, ...seatsResult.rows.map((s) => s.row_number));
		const maxCol = Math.max(
			hallRow.total_columns - 1,
			...seatsResult.rows.map((s) => s.column_number)
		);

		const seatPlan = Array.from({ length: maxRow + 1 }, () => Array(maxCol + 1).fill(null));

		// Populate seat plan with detailed seat information
		seatsResult.rows.forEach((seat) => {
			if (seat.row_number <= maxRow && seat.column_number <= maxCol) {
				seatPlan[seat.row_number][seat.column_number] = {
					label: seat.seat_label,
					status: seat.status,
					category: seat.category_name?.toLowerCase() || 'regular',
					priceModifier: seat.price_modifier || 1.0
				};
			} else {
				console.warn(
					`Seat at row ${seat.row_number}, column ${seat.column_number} is out of bounds and will be ignored.`
				);
			}
		});

		// Load available seat categories for the admin interface
		const categoriesResult = await pool.query(`
    SELECT id, name, price_modifier
    FROM seat_categories
    ORDER BY name
    `);

		const hallData = {
			id: hallRow.id,
			name: hallRow.name,
			total_rows: maxRow + 1,
			total_columns: maxCol + 1,
			total_seats: hallRow.total_seats,
			seat_plan: seatPlan,
			categories: categoriesResult.rows
		};

		return { hall: hallData };
	} catch (error) {
		console.error('Error loading hall:', error);
		return {
			hall: null,
			error: 'Database error while loading hall data.'
		};
	}
};

export const actions: Actions = {
	updateSeat: async ({ request, params }) => {
		const hallId = Number(params.hall_id);
		const body = await request.json();
		const { row_number, column_number, category_id } = body;

		try {
			// Update single seat
			await pool.query(
				`
UPDATE seats
SET category_id = $1
WHERE hall_id = $2 AND row_number = $3 AND column_number = $4
`,
				[category_id, hallId, row_number, column_number]
			);

			return { success: true };
		} catch (error) {
			console.error('Error updating seat:', error);
			return { success: false, error: 'Error updating seat.' };
		}
	}
};
