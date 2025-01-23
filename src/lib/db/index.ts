// src/lib/db/index.ts
import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
	user: process.env.PGUSER,
	host: process.env.PGHOST,
	database: process.env.PGDATABASE,
	password: process.env.PGPASSWORD,
	port: 5432,
	ssl: {
		rejectUnauthorized: false
	}
});

// Database helper functions
export async function getSeatPrice(seatId: number, screeningId: number) {
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

	return result.rows[0];
}

export async function lockSeat(seatId: number, userId: string, screeningId: number) {
	const client = await pool.connect();
	try {
		await client.query('BEGIN');

		// Clean up expired locks
		await client.query(`
            DELETE FROM seat_locks 
            WHERE locked_at < NOW() - INTERVAL '5 minutes'
        `);

		// Check existing locks
		const lockCheck = await client.query(
			`
            SELECT user_id 
            FROM seat_locks 
            WHERE seat_id = $1 AND user_id != $2
        `,
			[seatId, userId]
		);

		if (lockCheck.rows.length > 0) {
			throw new Error('Seat is already selected by another user');
		}

		// Check existing bookings
		const bookingCheck = await client.query(
			`
            SELECT 1 FROM seat_reservations 
            WHERE seat_id = $1 
            AND screening_id = $2 
            AND (status = 'confirmed' OR (status = 'pending' AND created_at > NOW() - INTERVAL '5 minutes'))
        `,
			[seatId, screeningId]
		);

		if (bookingCheck.rows.length > 0) {
			throw new Error('Seat is already booked');
		}

		// Create or update lock
		await client.query(
			`
            INSERT INTO seat_locks (seat_id, user_id, locked_at)
            VALUES ($1, $2, CURRENT_TIMESTAMP)
            ON CONFLICT (seat_id) 
            DO UPDATE SET 
                user_id = $2,
                locked_at = CURRENT_TIMESTAMP
            WHERE seat_locks.user_id = $2
        `,
			[seatId, userId]
		);

		await client.query('COMMIT');
		return true;
	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	} finally {
		client.release();
	}
}

export async function unlockSeat(seatId: number, userId: string) {
	return pool.query(
		`
        DELETE FROM seat_locks 
        WHERE seat_id = $1 AND user_id = $2
    `,
		[seatId, userId]
	);
}