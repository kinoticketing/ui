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

		const screeningResult = await pool.query(`
            SELECT 
                s.id as screening_id,
                s.movie_id,
                s.hall_id,
                s.start_time,
                s.end_time,
                h.name as hall_name,
                h.total_rows,
                h.total_columns,
                m.title as movie_title
            FROM screenings s
            JOIN halls h ON s.hall_id = h.id
            JOIN movies m ON s.movie_id = m.imdb_id
            WHERE s.id = $1
        `, [params.screening_id]);

		if (screeningResult.rowCount === 0) {
			throw error(404, 'Screening not found');
		}

		const row = screeningResult.rows[0];

		 // Get all halls for dropdown
        const hallsResult = await pool.query(`
            SELECT id, name 
            FROM halls 
            ORDER BY name
        `);

		// Create seat plan array using hall dimensions from query
		const seatPlan = Array(row.total_rows)
			.fill(null)
			.map(() => Array(row.total_columns).fill(null));

		// Rest of your existing code for seats query and processing...
		const seatsResult = await pool.query(`
            SELECT 
                s.row_number,
                s.column_number,
                s.seat_label,
                s.status,
                s.category_id,
                sc.name as category_name,
                sc.price_modifier,
                CASE 
                    WHEN t.id IS NOT NULL THEN true 
                    ELSE false 
                END as is_booked
            FROM seats s
            LEFT JOIN seat_categories sc ON s.category_id = sc.id
            LEFT JOIN tickets t ON t.seat_id = s.id 
                AND t.screening_id = $1 
                AND t.status = 'confirmed'
            WHERE s.hall_id = $2
            ORDER BY s.row_number, s.column_number
        `, [params.screening_id, row.hall_id]);

		// Fill seat plan with actual seat data
		seatsResult.rows.forEach((seat) => {
			seatPlan[seat.row_number - 1][seat.column_number - 1] = {
				label: seat.seat_label,
				status: seat.status,
				category: seat.category_name,
				category_id: seat.category_id,
				priceModifier: seat.price_modifier,
				isBooked: seat.is_booked
			};
		});

		const capacity = seatPlan.flat().filter((seat) => seat !== null).length;

		return {
			screening: {
				screening_id: row.screening_id,
				movie_id: row.movie_id,
				movie_title: row.movie_title,
				hall_id: row.hall_id,
				hall_name: row.hall_name,
				start_time: row.start_time,
				end_time: row.end_time,
				capacity,
				seat_plan: seatPlan
			},
			halls: hallsResult.rows.map((hall) => ({
				id: hall.id,
				name: hall.name
			}))
		};
	} catch (err) {
		console.error('Fehler im load:', err);
		throw error(500, 'Datenbankfehler beim Laden der Vorstellung');
	}
};

