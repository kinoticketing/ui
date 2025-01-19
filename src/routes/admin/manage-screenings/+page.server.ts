import pkg from 'pg';
const { Pool } = pkg;
import type { PageServerLoad } from './$types';

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

export const load: PageServerLoad = async () => {
	try {
		const result = await pool.query(`
SELECT
s.id as showtime_id,
s.movie_id,
m.title as movie_title,
m.poster_url as movie_poster_url,
s.start_time as showtime,
s.end_time,
h.name AS hall_name,
(SELECT COUNT(*) FROM seats WHERE hall_id = h.id) as total_seats,
(
SELECT COUNT(*)
FROM seat_reservations sr
WHERE sr.screening_id = s.id
AND sr.status = 'confirmed'
) as reserved_seats
FROM screenings s
JOIN halls h ON s.hall_id = h.id
JOIN movies m ON s.movie_id = m.imdb_id
ORDER BY s.start_time ASC
`);
		const showtimes = result.rows.map((row) => ({
			showtime_id: row.showtime_id,
			movie_id: row.movie_id,
			movie_title: row.movie_title,
			movie_poster_url: row.movie_poster_url,
			hall_name: row.hall_name,
			showtime: row.showtime,
			end_time: row.end_time,
			total_seats: Number(row.total_seats),
			reserved_seats: Number(row.reserved_seats),
			occupancy_percentage: Math.round(
				(Number(row.reserved_seats) / Number(row.total_seats)) * 100 || 0
			)
		}));
		return { showtimes };
	} catch (error) {
		console.error('Error loading screenings:', error);
		return { showtimes: [] };
	}
};
