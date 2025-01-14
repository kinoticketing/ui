import pkg from 'pg';
const { Pool } = pkg;
import type { RequestEvent } from '@sveltejs/kit';

const pool = new Pool({
	user: process.env.PGUSER,
	host: process.env.PGHOST,
	database: process.env.PGDATABASE,
	password: process.env.PGPASSWORD,
	port: 5432,
	ssl: {
		rejectUnauthorized: false // SSL aktivieren und unsignierte Zertifikate zulassen
	}
});

export async function load() {
	try {
		// Modified query to include seat_plan
		const query = `
            SELECT 
                id AS hall_id,
                name,
                (SELECT COUNT(*) FROM seats WHERE hall_id = halls.id) AS capacity,
                total_rows,
                total_columns,
                (
                    SELECT json_agg(
                        json_build_object(
                            'seat_label', seat_label,
                            'category', sc.name,
                            'status', s.status
                        )
                        ORDER BY row_number, column_number
                    )
                    FROM seats s
                    LEFT JOIN seat_categories sc ON s.category_id = sc.id
                    WHERE s.hall_id = halls.id
                ) as seat_plan
            FROM halls
            ORDER BY name
        `;
		const result = await pool.query(query);
		return { halls: result.rows };
	} catch (error) {
		console.error('Fehler beim Laden der Säle:', error);
		return { halls: [] };
	}
}

export const actions = {
	delete: async ({ params }: RequestEvent) => {
		const { hall_id } = params as { hall_id: string };
		try {
			await pool.query('DELETE FROM halls WHERE id = $1', [hall_id]);
			return { success: true };
		} catch (error) {
			console.error('Fehler beim Löschen des Saals:', error);
			return { success: false };
		}
	}
};
