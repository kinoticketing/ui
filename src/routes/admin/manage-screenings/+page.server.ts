import pkg from 'pg';
const {Pool} = pkg;

const pool = new Pool({
	user: process.env.PGUSER,
	host: process.env.PGHOST,
	database: process.env.PGDATABASE,
	password: process.env.PGPASSWORD,
	port: 5432,
    ssl: {
        rejectUnauthorized: false // Fix für self-signed certificate error
    }
});

export async function load() {
	try {
		// Abfrage der Vorstellungen inklusive Filmname und Saalname
		const result = await pool.query(`
            SELECT 
                s.showtime_id,
                s.showtime,
                m.title AS movie_title,
                c.name AS hall_name
            FROM showtimes s
            JOIN movies m ON s.movie_id = m.movie_id
            JOIN cinema_halls c ON s.hall_id = c.hall_id
            ORDER BY s.showtime ASC
        `);
		return { showtimes: result.rows };
	} catch (error) {
		console.error('Fehler beim Laden der Vorstellungen:', error);
		return { showtimes: [] }; // Rückgabe eines leeren Arrays bei Fehler
	}
}
