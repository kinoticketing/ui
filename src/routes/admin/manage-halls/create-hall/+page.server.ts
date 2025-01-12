// src/routes/admin/manage-halls/create-hall/+page.server.ts
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
        rejectUnauthorized: false
    }
});

async function getOrCreateSeatCategory(categoryName: string) {
    const findQuery = `
        SELECT id FROM seat_categories 
        WHERE name = $1
    `;
    const existingCategory = await pool.query(findQuery, [categoryName]);
    
    if (existingCategory.rows.length > 0) {
        return existingCategory.rows[0].id;
    }

    const insertQuery = `
        INSERT INTO seat_categories (name, description, price_modifier)
        VALUES ($1, $2, $3)
        RETURNING id
    `;
    const description = `${categoryName} seats`;
    const priceModifier = categoryName === 'VIP' ? 1.5 : 
                         categoryName === 'Disabled' ? 0.8 : 
                         1.0;
    
    const result = await pool.query(insertQuery, [categoryName, description, priceModifier]);
    return result.rows[0].id;
}

export const actions = {
    create: async ({ request }) => {  // Changed from 'default' to 'create'
        const formData = await request.formData();
        const hall_name = formData.get('hall_name');
        const row_count = formData.get('row_count');
        const col_count = formData.get('col_count');
        const seat_plan = formData.get('seat_plan');

        if (!hall_name || !row_count || !col_count || !seat_plan) {
            return fail(400, { message: 'Missing required data' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const insertHallQuery = `
                INSERT INTO halls (name, total_rows, total_columns)
                VALUES ($1, $2, $3)
                RETURNING id
            `;
            const hallResult = await client.query(insertHallQuery, [
                hall_name,
                Number(row_count),
                Number(col_count)
            ]);
            const hallId = hallResult.rows[0].id;

            const seatPlanArray = JSON.parse(seat_plan as string);
            
            for (let r = 0; r < seatPlanArray.length; r++) {
                for (let c = 0; c < seatPlanArray[r].length; c++) {
                    const seatType = seatPlanArray[r][c];
                    const seatLabel = String.fromCharCode(65 + r) + (c + 1);
                    const categoryId = await getOrCreateSeatCategory(seatType);

                    await client.query(`
                        INSERT INTO seats (
                            hall_id,
                            row_number,
                            column_number,
                            seat_label,
                            status,
                            category_id
                        ) VALUES ($1, $2, $3, $4, $5, $6)
                    `, [
                        hallId,
                        r + 1,
                        c + 1,
                        seatLabel,
                        'active',
                        categoryId
                    ]);
                }
            }

            await client.query('COMMIT');

            return {
                success: true,
                message: 'Hall successfully created!',
                hall_id: hallId
            };
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error saving hall:', error);
            return fail(500, { message: 'Error saving hall' });
        } finally {
            client.release();
        }
    }
};