// src/routes/movies/[id]/[showtime_id]/+page.server.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
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
		// Get movie data with explicit fields
		const movieResult = await pool.query('SELECT * FROM movies WHERE imdb_id = $1', [params.id]);

		if (movieResult.rows.length === 0) {
			throw error(404, 'Movie not found');
		}

		// Get screening with hall and seats data
		const screeningResult = await pool.query(
			`SELECT 
                s.id,
                s.hall_id,
                s.movie_id,
                s.start_time,
                s.end_time,
                s.created_at,
                s.updated_at,
                h.name as hall_name,
                h.total_rows,
                h.total_columns,
                (
                    SELECT json_agg(
                        json_build_object(
                            'id', seats.id,
                            'seat_label', seats.seat_label,
                            'row_number', seats.row_number,
                            'column_number', seats.column_number,
							'status', seats.status,
                            'category', (
                                SELECT json_build_object(
                                    'id', sc.id,
                                    'name', sc.name,
                                    'description', sc.description,
                                    'price_modifier', sc.price_modifier
                                )
                                FROM seat_categories sc 
                                WHERE sc.id = seats.category_id
                            ),
							'isBooked', (
								EXISTS (
									SELECT 1 
									FROM tickets t 
									WHERE t.seat_id = seats.id 
									AND t.screening_id = s.id
									AND t.status = 'confirmed'
								) OR
								EXISTS (
									SELECT 1 
									FROM seat_reservations sr 
									WHERE sr.seat_id = seats.id 
									AND sr.screening_id = s.id
									AND sr.status = 'confirmed'
								)
							),
							'isLocked', (
								EXISTS (
									SELECT 1 
									FROM seat_locks sl 
									WHERE sl.seat_id = seats.id 
									AND sl.locked_at > NOW() - INTERVAL '5 minutes'
								)
							),
							'lockedBy', (
								SELECT sl.user_id 
								FROM seat_locks sl 
								WHERE sl.seat_id = seats.id 
								AND sl.locked_at > NOW() - INTERVAL '5 minutes'
								LIMIT 1
							)
                        )
                        ORDER BY seats.row_number, seats.column_number
                    )
                ) as seats
            FROM screenings s
            JOIN halls h ON s.hall_id = h.id
            LEFT JOIN seats ON seats.hall_id = h.id
            WHERE s.id = $1
            GROUP BY s.id, h.id;`,
			[params.showtime_id]
		);

		if (screeningResult.rows.length === 0) {
			throw error(404, 'Screening not found');
		}

		// Transform seats array into 2D seat plan
		const screening = screeningResult.rows[0];
		const seats = screening.seats;
		const seatPlan: Array<Array<any>> = [];

		for (let row = 0; row < screening.total_rows; row++) {
			seatPlan[row] = [];
			for (let col = 0; col < screening.total_columns; col++) {
				const seat = seats.find(
					(s: any) => s.row_number === row + 1 && s.column_number === col + 1
				);
				seatPlan[row][col] = seat || null;
			}
		}

		return {
			movie: movieResult.rows[0],
			screening: {
				...screening,
				hall: {
					id: screening.hall_id,
					name: screening.hall_name,
					total_rows: screening.total_rows,
					total_columns: screening.total_columns,
					seatPlan
				}
			}
		};
	} catch (e) {
		console.error('Error loading movie and screening:', e);
		throw error(500, 'Error loading movie and screening data');
	}
};
