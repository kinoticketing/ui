import { fail } from '@sveltejs/kit';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: 5432,
    ssl: {
        rejectUnauthorized: false,
    },
});

export async function load() {
    try {
        const hallsResult = await pool.query('SELECT hall_id, name FROM cinema_halls ORDER BY name');
        return { halls: hallsResult.rows };
    } catch (error) {
        console.error('Fehler beim Laden der Säle:', error);
        return { halls: [] };
    }
}

export const actions = {
    default: async ({ request }) => {
        const formData = await request.formData();
        const movie_id = formData.get('movie_id'); // IMDB-ID
        const hall_id = formData.get('hall_id');
        const showtime = formData.get('showtime');

        if (!movie_id || !hall_id || !showtime) {
            return fail(400, { message: 'Bitte füllen Sie alle Felder aus.' });
        }

        try {
            // Vorstellung in die Tabelle `showtimes` einfügen
            await pool.query(
                `INSERT INTO showtimes (movie_id, hall_id, showtime) VALUES ($1, $2, $3)`,
                [movie_id, hall_id, showtime]
            );

            return { success: true, message: 'Vorstellung erfolgreich erstellt!' };
        } catch (error) {
            console.error('Fehler beim Speichern der Vorstellung:', error);
            return fail(500, { message: 'Fehler beim Speichern der Vorstellung.' });
        }
    },
};
