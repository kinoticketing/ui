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

// DELETE-Methode für das Löschen eines Saals
export const DELETE: RequestHandler = async ({ params }) => {
    const { hall_id } = params;

    try {
        await pool.query('DELETE FROM cinema_halls WHERE hall_id = $1', [hall_id]);
        return new Response(null, { status: 204 }); // Erfolgreich gelöscht
    } catch (error) {
        console.error('Fehler beim Löschen des Saals:', error);
        return new Response('Fehler beim Löschen des Saals', { status: 500 });
    }
};
