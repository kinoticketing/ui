// src/routes/api/account/verify-password/+server.ts
import { json, type RequestEvent } from '@sveltejs/kit';
import bcrypt from 'bcrypt';
import pkg from 'pg';
const { Pool } = pkg;

interface RequestBody {
	password: string;
}

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

export async function POST(event: RequestEvent) {
	try {
		// Get user from session
		const userId = (event.locals as App.Locals).userId;
		if (!userId) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = (await event.request.json()) as RequestBody;
		if (!body.password) {
			return json({ error: 'Password is required' }, { status: 400 });
		}

		// Get stored password hash
		const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);

		if (result.rows.length === 0) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		const storedHash = result.rows[0].password_hash;
		if (!storedHash) {
			return json({ error: 'No password set' }, { status: 400 });
		}

		// Verify password
		const isValid = await bcrypt.compare(body.password, storedHash);
		if (!isValid) {
			return json({ error: 'Invalid password' }, { status: 401 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error verifying password:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
