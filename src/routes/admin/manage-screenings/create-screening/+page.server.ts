import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
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

export const load: PageServerLoad = async () => {
    try {
        // Nur Halls mit aktiven Sitzen
        const activeHalls = await pool.query(`
            SELECT id, name 
            FROM halls 
            WHERE id IN (
                SELECT DISTINCT hall_id 
                FROM seats 
                WHERE status = 'active'
            )
            ORDER BY name
        `);

        return {
            halls: activeHalls.rows.map((hall) => ({
                id: hall.id,
                name: hall.name
            }))
        };
    } catch (error) {
        console.error('Error loading halls:', error);
        return { halls: [] };
    }
};

export const actions: Actions = {
    default: async ({ request }) => {
        const formData = await request.formData();
        const movie_id = formData.get('movie_id')?.toString(); // z. B. "tt1320253"
        const hall_id = parseInt(formData.get('hall_id')?.toString() || '');
        const start_time = formData.get('start_time')?.toString(); // datetime-local

        // Validierung
        if (!movie_id || !hall_id || !start_time) {
            return fail(400, { 
                message: 'Please fill in all fields.',
                values: { movie_id, hall_id, start_time }
            });
        }

        // Beispiel: feste Dauer (120 min)
        const fixedDurationMinutes = 120;

        try {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                // end_time = start_time + 120 min
                const endQuery = await client.query(
                    `SELECT ($1::timestamp + interval '1 minute' * $2) as end_time`,
                    [start_time, fixedDurationMinutes]
                );
                const end_time = endQuery.rows[0].end_time; 

                // Check Overlap
                const overlap = await client.query(`
                    SELECT id FROM screenings 
                    WHERE hall_id = $1
                      AND tstzrange(start_time, end_time) && tstzrange($2::timestamp, $3::timestamp)
                `, [hall_id, start_time, end_time]);

                if (overlap.rows.length > 0) {
                    await client.query('ROLLBACK');
                    return fail(400, {
                        message: 'There is already a screening scheduled in this hall during this time.',
                        values: { movie_id, hall_id, start_time }
                    });
                }

                // Check if hall has active seats
                const seatsCheck = await client.query(`
                    SELECT COUNT(*) FROM seats 
                    WHERE hall_id = $1 AND status = 'active'
                `, [hall_id]);
                if (parseInt(seatsCheck.rows[0].count) === 0) {
                    await client.query('ROLLBACK');
                    return fail(400, {
                        message: 'Selected hall has no active seats configured.',
                        values: { movie_id, hall_id, start_time }
                    });
                }

                // Insert
                await client.query(`
                    INSERT INTO screenings (movie_id, hall_id, start_time, end_time)
                    VALUES ($1, $2, $3, $4)
                `, [movie_id, hall_id, start_time, end_time]);

                await client.query('COMMIT');

                return {
                    success: true,
                    message: 'Screening successfully created!'
                };
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error saving screening:', error);
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Database error:', error);
            return fail(500, {
                message: 'Error saving the screening. Please try again.',
                values: { movie_id, hall_id, start_time }
            });
        }
    }
};
