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

export async function load() {
	try {
		// Säle aus der Datenbank laden
		const hallsResult = await pool.query('SELECT hall_id, name FROM cinema_halls ORDER BY name');
		return { halls: hallsResult.rows };
	} catch (error) {
		console.error('Fehler beim Laden der Säle:', error);
		return { halls: [] };
	}
}