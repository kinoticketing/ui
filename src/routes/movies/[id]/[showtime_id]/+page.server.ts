/* eslint-disable @typescript-eslint/no-unused-vars */
// src/routes/movies/[id]/[showtime_id]/+page.server.ts
import type { PageServerLoad, Actions } from './$types';
import type { PageData } from './$types';
import type { Seat } from './types';
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

export const load: PageServerLoad = async ({ params }): Promise<PageData> => {
    try {
        const screeningId = params.showtime_id;

        console.log('Screening ID', screeningId)
        if (!screeningId) {
            console.log('INVALID SCREENING ID')
            return {
                movie: null,
                screening: null,
                error: 'Invalid screening ID'
            };
        }

        // Load movie and screening data
        const result = await pool.query(
            `
            SELECT 
                m.imdb_id AS movie_id,    -- PK of movies
                m.title AS movie_title,
                m.duration,
                scr.id,             -- PK of screenings
                scr.hall_id,        -- FK to halls
                scr.start_time,
                scr.end_time,
                h.name AS hall_name,
                h.total_rows,
                h.total_columns
            FROM screenings scr
            JOIN movies m ON m.imdb_id = scr.movie_id
            JOIN halls h ON h.id = scr.hall_id
            WHERE scr.id = $1
            `,
            [screeningId]
        );
        console.log('RESULT LOAD MOVIE AND SCREENING: ', result);

        if (result.rowCount === 0) {
            return {
                movie: null,
                screening: null,
                error: `Screening not found`
            };
        }

        const data = result.rows[0];

        // Load basic seat data
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
            [data.hall_id]
        );

        // Get reservations for this screening separately
        const reservationsResult = await pool.query(
            `
            SELECT 
                s.seat_label,
                sr.status AS reservation_status
            FROM seat_reservations sr
            JOIN seats s ON s.id = sr.seat_id
            WHERE sr.screening_id = $1
                AND sr.status = 'active'
                AND (sr.expiration_time IS NULL OR sr.expiration_time > NOW())
            `,
            [screeningId]
        );

        // Create map of reserved seats
        const reservedSeats = new Map(
            reservationsResult.rows.map(row => [row.seat_label, row.reservation_status])
        );

        // Create the 2D seat plan
        const seatPlan: (Seat | null)[][] = [];
        for (let r = 0; r < data.total_rows; r++) {
            seatPlan[r] = [];
            for (let c = 0; c < data.total_columns; c++) {
                seatPlan[r][c] = null;
            }
        }

        // Fill in seat data
        for (const seat of seatsResult.rows) {
            seatPlan[seat.row_number][seat.column_number] = {
                label: seat.seat_label,
                status: seat.status,
                isBooked: reservedSeats.has(seat.seat_label),
                row: seat.row_number,
                column: seat.column_number
            };
        }

        return {
            movie: {
                id: data.movie_id,
                title: data.movie_title,
                duration: data.duration
            },
            screening: {
                id: data.id,
                startTime: data.start_time,
                endTime: data.end_time,
                hall: {
                    id: data.hall_id,
                    name: data.hall_name,
                    seatPlan: seatPlan
                }
            }
        };
    } catch (error) {
        console.error('Error loading booking data:', error);
        return {
            movie: null,
            screening: null,
            error:
                error instanceof Error ? error.message : 'Database error while loading booking information.'
        };
    }
};