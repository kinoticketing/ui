// src/routes/admin/manage-halls/[hall_id]/+server.ts
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

export const DELETE: RequestHandler = async ({ params }) => {
    const { hall_id } = params;
    const id = Number(hall_id);

    try {
        await pool.query('BEGIN');

        // Delete related records first
        await pool.query('DELETE FROM seats WHERE hall_id = $1', [id]);
        await pool.query('DELETE FROM screenings WHERE hall_id = $1', [id]);
        await pool.query('DELETE FROM halls WHERE id = $1', [id]);

        await pool.query('COMMIT');
        return new Response(null, { status: 204 });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error deleting hall:', error);
        return new Response('Error deleting hall', { status: 500 });
    }
};
