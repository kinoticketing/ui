import { fail } from '@sveltejs/kit';
import pkg from 'pg';
const {Pool} = pkg;

// PostgreSQL-Verbindung einrichten
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

// Funktion zur Speicherung der Daten
export const actions = {
    default: async ({ request }) => {
        const formData = await request.formData();
        const hall_name = formData.get('hall_name');
        const row_count = formData.get('row_count');
        const col_count = formData.get('col_count');
        const seat_plan = formData.get('seat_plan');

        // Validierung
        if (!hall_name || !row_count || !col_count || !seat_plan) {
            return fail(400, { message: 'Fehlende Daten' });
        }

        try {
            // Einfügen in die Datenbank
            const result = await pool.query(
                `INSERT INTO cinema_halls (name, capacity, seat_plan)
                 VALUES ($1, $2, $3) RETURNING hall_id`,
                [hall_name, Number(row_count) * Number(col_count), seat_plan]
            );

            return {
                success: true,
                message: 'Saal erfolgreich gespeichert!',
                hall_id: result.rows[0].hall_id
            };
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            return fail(500, { message: 'Fehler beim Speichern' });
        }
    }
};
