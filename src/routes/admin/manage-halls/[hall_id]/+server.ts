// src/routes/admin/manage-halls/[hall_id]/+server.ts
import pkg from 'pg';
import type { RequestHandler } from '@sveltejs/kit';

const { Pool } = pkg;
const pool = new Pool({
	user: process.env.PGUSER,
	host: process.env.PGHOST,
	database: process.env.PGDATABASE,
	password: process.env.PGPASSWORD,
	port: 5432,
	ssl: { rejectUnauthorized: false }
});

export const DELETE: RequestHandler = async ({ params }) => {
	const { hall_id } = params;
	const id = Number(hall_id);

	try {
		await pool.query('BEGIN');

		// Delete related records first
		await pool.query('DELETE FROM seats WHERE hall_id = $1', [id]);
		await pool.query('DELETE FROM screenings WHERE hall_id = $1', [id]);
		await pool.query('DELETE FROM halls WHERE id = $1', [id]);

		await pool.query('COMMIT');
		return new Response(null, { status: 204 });
	} catch (error) {
		await pool.query('ROLLBACK');
		console.error('Error deleting hall:', error);
		return new Response('Error deleting hall', { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const { hall_id } = params;
	const { name, total_rows, total_columns, seat_plan } = await request.json();

	try {
		await pool.query('BEGIN');

		// Update hall information
		await pool.query(
			`UPDATE halls 
             SET name = $1, total_rows = $2, total_columns = $3
             WHERE id = $4`,
			[name, total_rows, total_columns, hall_id]
		);

		// Delete existing seats
		await pool.query('DELETE FROM seats WHERE hall_id = $1', [hall_id]);

		// Insert new seats
		for (let rowIndex = 0; rowIndex < seat_plan.length; rowIndex++) {
			for (let colIndex = 0; colIndex < seat_plan[rowIndex].length; colIndex++) {
				const seat = seat_plan[rowIndex][colIndex];
				if (seat) {
					// Get category_id based on category name
					const categoryResult = await pool.query(
						'SELECT id FROM seat_categories WHERE LOWER(name) = LOWER($1)',
						[seat.category]
					);

					const categoryId = categoryResult.rows[0]?.id;

					if (categoryId) {
						await pool.query(
							`INSERT INTO seats 
                             (hall_id, row_number, column_number, seat_label, status, category_id)
                             VALUES ($1, $2, $3, $4, $5, $6)`,
							[hall_id, rowIndex + 1, colIndex + 1, seat.label, seat.status, categoryId]
						);
					}
				}
			}
		}

		await pool.query('COMMIT');
		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		await pool.query('ROLLBACK');
		console.error('Error updating hall:', error);
		return new Response(JSON.stringify({ error: 'Failed to update hall' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
