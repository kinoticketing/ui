import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const username = formData.get('username');
		const email = formData.get('email');
		const password = formData.get('password');

		if (!username || !email || !password) {
			return fail(400, { message: 'Missing required fields' });
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
				return fail(400, { message: 'Username or email already exists' });
			}

			// TODO: Hash the password (use a proper hashing library like bcrypt in production)
			const hashedPassword = password; // Replace with actual hashing

			// Insert new user
			const result = await client.query(
				'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id',
				[username, email, hashedPassword]
			);
            console.log(result); //remove later

			client.release();

			// Redirect to login page after successful registration
			throw redirect(303, '/auth/login');
		} catch (error) {
			console.error('Error creating account:', error);
			return fail(500, { message: 'An error occurred while creating the account' });
		}
	}
};