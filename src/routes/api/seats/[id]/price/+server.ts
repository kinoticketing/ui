// src/routes/api/seats/[id]/price/+server.ts
import { json, type RequestEvent } from '@sveltejs/kit';
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

export async function GET(event: RequestEvent) {
    try {
        const seatId = event.params.id;
        const screeningId = event.url.searchParams.get('screeningId');

        if (!seatId || !screeningId) {
            return json({ error: 'Missing required parameters' }, { status: 400 });
        }

        // Get seat price components
        const result = await pool.query(
            `WITH seat_info AS (
                SELECT 
                    s.id as seat_id,
                    s.category_id,
                    sc.name as category_name,
                    sc.price_modifier as category_modifier
                FROM seats s
                JOIN seat_categories sc ON s.category_id = sc.id
                WHERE s.id = $1
            ),
            screening_info AS (
                SELECT 
                    sp.screening_id,
                    bp.base_price,
                    COALESCE(sp.price_modifier, 0) as screening_modifier
                FROM screening_prices sp
                JOIN base_prices bp ON sp.base_price_id = bp.id
                WHERE sp.screening_id = $2
            )
            SELECT 
                si.seat_id,
                si.category_name,
                COALESCE(scr.base_price, 
                    (SELECT base_price FROM base_prices WHERE is_default = true)
                ) as base_price,
                COALESCE(scr.screening_modifier, 0) as screening_modifier,
                si.category_modifier,
                (COALESCE(scr.base_price, 
                    (SELECT base_price FROM base_prices WHERE is_default = true)
                ) + COALESCE(scr.screening_modifier, 0) + si.category_modifier) as final_price
            FROM seat_info si
            LEFT JOIN screening_info scr ON true`,
            [seatId, screeningId]
        );

        if (result.rows.length === 0) {
            return json({ error: 'Seat or screening not found' }, { status: 404 });
        }

        return json({
            price: result.rows[0].final_price,
            breakdown: {
                basePrice: result.rows[0].base_price,
                screeningModifier: result.rows[0].screening_modifier,
                categoryModifier: result.rows[0].category_modifier,
                categoryName: result.rows[0].category_name
            }
        });
    } catch (error) {
        console.error('Error calculating seat price:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}