import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
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

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const session = await locals.getSession();
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const client = await pool.connect();
	try {
		const { screeningId } = await request.json();

		// Delete any existing reservations
		await client.query(
			`DELETE FROM seat_reservations 
             WHERE seat_id = $1 
             AND screening_id = $2 
             AND user_id = $3`,
			[params.id, screeningId, session.user.id]
		);

		return json({ success: true });
	} catch (error) {
		console.error('Error releasing reservation:', error);
		return json({ error: 'Failed to release reservation' }, { status: 500 });
	} finally {
		client.release();
	}
};
