/* eslint-disable @typescript-eslint/no-unused-vars */
import { fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
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

interface Hall {
    id: number;
    name: string;
}

export const load: PageServerLoad = async () => {
    try {
        const hallsResult = await pool.query('SELECT id, name FROM halls ORDER BY name');
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
            halls: activeHalls.rows.map(hall => ({
                id: hall.id,
                name: hall.name
            }))
        };
    } catch (error) {
        console.error('Error loading halls:', error);
        return { halls: [] };
    }
};

export const actions = {
    default: async ({ request }) => {
        const formData = await request.formData();
        const movie_id = formData.get('movie_id')?.toString();
        const hall_id = parseInt(formData.get('hall_id')?.toString() || '');
        const start_time = formData.get('start_time')?.toString();
        const duration_minutes = parseInt(formData.get('duration_minutes')?.toString() || '');

        // Validation
        if (!movie_id || !hall_id || !start_time || !duration_minutes) {
            return fail(400, { 
                message: 'Please fill in all fields.',
                values: { movie_id, hall_id, start_time, duration_minutes }
            });
        }

        try {
            const client = await pool.connect();
            
            try {
                await client.query('BEGIN');

                // Calculate end time based on start time and duration
                const end_time = await client.query(`
                    SELECT ($1::timestamp + interval '1 minute' * $2) as end_time
                `, [start_time, duration_minutes]);

                // Check for overlapping screenings
                const overlap = await client.query(`
                    SELECT id FROM screenings 
                    WHERE hall_id = $1 
                    AND tstzrange(start_time, end_time) && tstzrange($2::timestamp, $3::timestamp)
                `, [hall_id, start_time, end_time.rows[0].end_time]);

                if (overlap.rows.length > 0) {
                    await client.query('ROLLBACK');
                    return fail(400, { 
                        message: 'There is already a screening scheduled in this hall during the selected time.',
                        values: { movie_id, hall_id, start_time, duration_minutes }
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
                        values: { movie_id, hall_id, start_time, duration_minutes }
                    });
                }

                // Insert the screening
                await client.query(`
                    INSERT INTO screenings (movie_id, hall_id, start_time, end_time) 
                    VALUES ($1, $2, $3, $4)
                `, [movie_id, hall_id, start_time, end_time.rows[0].end_time]);

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
                values: { movie_id, hall_id, start_time, duration_minutes }
            });
        }
    },
};