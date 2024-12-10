import pkg from 'pg';
const {Pool} = pkg;

const pool = new Pool({
	user: process.env.PGUSER,
	host: process.env.PGHOST,
	database: process.env.PGDATABASE,
	password: process.env.PGPASSWORD,
	port: 5432,
    ssl: {
        rejectUnauthorized: false // SSL aktivieren und unsignierte Zertifikate zulassen
    },
});

export async function load() {
	try {
		// Daten aus der Tabelle `cinema_halls` laden
		const result = await pool.query('SELECT hall_id, name, capacity FROM cinema_halls ORDER BY name');
		return { halls: result.rows };
	} catch (error) {
		console.error('Fehler beim Laden der Säle:', error);
		return { halls: [] }; // Rückgabe eines leeren Arrays bei Fehler
	}
}
