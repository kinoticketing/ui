// src/routes/api/account/update-password/+server.ts
import { json, type RequestEvent } from '@sveltejs/kit';
import bcrypt from 'bcrypt';
import pkg from 'pg';
const { Pool } = pkg;

interface RequestBody {
	currentPassword: string | null;
	newPassword: string;
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

const SALT_ROUNDS = 12;

export async function POST(event: RequestEvent) {
	try {
		// Get user from session
		const userId = (event.locals as App.Locals).userId;
		if (!userId) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = (await event.request.json()) as RequestBody;

		// Validate new password
		const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
		if (!body.newPassword || !passwordRegex.test(body.newPassword)) {
			return json(
				{
					error:
						'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.'
				},
				{ status: 400 }
			);
		}

		// Get user's current password status
		const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);

		if (userResult.rows.length === 0) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		const hasExistingPassword = !!userResult.rows[0].password_hash;

		// If user has existing password, verify current password
		if (hasExistingPassword) {
			if (!body.currentPassword) {
				return json({ error: 'Current password is required' }, { status: 400 });
			}

			const isValid = await bcrypt.compare(body.currentPassword, userResult.rows[0].password_hash);

			if (!isValid) {
				return json({ error: 'Current password is incorrect' }, { status: 401 });
			}
		}

		// Hash and update new password
		const hashedPassword = await bcrypt.hash(body.newPassword, SALT_ROUNDS);

		await pool.query(
			'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
			[hashedPassword, userId]
		);

		return json({
			success: true,
			message: hasExistingPassword
				? 'Password updated successfully'
				: 'Password created successfully'
		});
	} catch (error) {
		console.error('Error updating password:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
