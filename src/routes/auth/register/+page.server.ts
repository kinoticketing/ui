import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import pkg from 'pg';
import bcrypt from 'bcrypt';

const { Pool } = pkg;
const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const username = formData.get('username')?.toString();
		const email = formData.get('email')?.toString();
		const password = formData.get('password')?.toString();
		const confirmPassword = formData.get('confirmPassword')?.toString();

		// Validation
		if (!username || !email || !password || !confirmPassword) {
			return fail(400, {
				message: 'All fields are required',
				username,
				email
			});
		}

		if (password !== confirmPassword) {
			return fail(400, {
				message: 'Passwords do not match',
				username,
				email
			});
		}

		try {
			const client = await pool.connect();

			// Check if user already exists
			const existingUser = await client.query(
				'SELECT * FROM users WHERE username = $1 OR email = $2',
				[username, email]
			);

			if (existingUser.rows.length > 0) {
				client.release();
				return fail(400, {
					message: 'Username or email already exists',
					username,
					email
				});
			}

			// Hash the password
			const hashedPassword = await bcrypt.hash(password, 10);

			// Insert new user with has_password flag set to true
			await client.query(
				`INSERT INTO users (
          username, 
          email, 
          password_hash,
          has_password,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
				[username, email, hashedPassword, true]
			);

			client.release();

			// Instead of throwing a redirect, return a success status
			return { success: true };
		} catch (error) {
			console.error('Error creating account:', error);
			return fail(500, {
				message: 'An error occurred while creating the account',
				username,
				email
			});
		}
	}
};
