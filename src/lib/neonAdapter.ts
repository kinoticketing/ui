/* eslint-disable @typescript-eslint/no-unused-vars */
import pkg from 'pg';
import type { Adapter, AdapterSession, AdapterUser } from '@auth/core/adapters';

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

// Define our internal user type for database operations
interface DatabaseUser {
	id: string;
	name: string | null;
	email: string | null;
	emailVerified: Date | null;
	image: string | null;
	password_hash?: string | null;
	street_address?: string | null;
	city?: string | null;
	state?: string | null;
	postal_code?: string | null;
	country?: string | null;
	github_id?: string | null;
}

export async function getUserAddress(userId: string) {
	const client = await pool.connect();
	try {
		const result = await client.query(
			'SELECT street_address, postal_code, city, state, country FROM users WHERE id = $1',
			[userId]
		);
		return result.rows[0] || null;
	} finally {
		client.release();
	}
}

export async function updateUserAddress(
	userId: string,
	address: {
		street_address: string;
		city: string;
		state: string;
		postal_code: string;
		country: string;
	}
) {
	const { rows } = await pool.query(
		`UPDATE users 
         SET street_address = $1,
             city = $2,
             state = $3,
             postal_code = $4,
             country = $5,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $6
         RETURNING street_address, city, state, postal_code, country`,
		[
			address.street_address,
			address.city,
			address.state,
			address.postal_code,
			address.country,
			userId
		]
	);
	return rows[0];
}

export const NeonAdapter: Adapter = {
	async createUser(user): Promise<AdapterUser> {
		const { rows } = await pool.query(
			`INSERT INTO users (
                username, 
                email, 
                github_id,
                created_at,
                updated_at
            ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
            RETURNING id, username as name, email`,
			[user.name, user.email, user.id]
		);

		// Return only the fields that AdapterUser expects
		return {
			id: rows[0].id.toString(),
			name: rows[0].name,
			email: rows[0].email,
			emailVerified: null,
			image: null
		};
	},

	async getUser(id): Promise<AdapterUser | null> {
		const { rows } = await pool.query(
			'SELECT id, username as name, email FROM users WHERE id = $1',
			[id]
		);

		if (!rows[0]) return null;

		// Return only the fields that AdapterUser expects
		return {
			id: rows[0].id.toString(),
			name: rows[0].name,
			email: rows[0].email,
			emailVerified: null,
			image: null
		};
	},

	async getUserByEmail(email): Promise<AdapterUser | null> {
		const { rows } = await pool.query(
			'SELECT id, username as name, email FROM users WHERE email = $1',
			[email]
		);

		if (!rows[0]) return null;

		// Return only the fields that AdapterUser expects
		return {
			id: rows[0].id.toString(),
			name: rows[0].name,
			email: rows[0].email,
			emailVerified: null,
			image: null
		};
	},

	async getUserByAccount({ providerAccountId, provider }): Promise<AdapterUser | null> {
		if (provider === 'github') {
			const { rows } = await pool.query(
				'SELECT id, username as name, email FROM users WHERE github_id = $1',
				[providerAccountId]
			);

			if (!rows[0]) return null;

			// Return only the fields that AdapterUser expects
			return {
				id: rows[0].id.toString(),
				name: rows[0].name,
				email: rows[0].email,
				emailVerified: null,
				image: null
			};
		}
		return null;
	},

	async updateUser(user): Promise<AdapterUser> {
		const { rows } = await pool.query(
			'UPDATE users SET username = $1, email = $2 WHERE id = $3 RETURNING id, username as name, email',
			[user.name, user.email, user.id]
		);

		// Return only the fields that AdapterUser expects
		return {
			id: rows[0].id.toString(),
			name: rows[0].name,
			email: rows[0].email,
			emailVerified: null,
			image: null
		};
	},

	async deleteUser(userId) {
		await pool.query('DELETE FROM users WHERE id = $1', [userId]);
	},

	async linkAccount(account) {
		await pool.query('UPDATE users SET github_id = $1 WHERE id = $2', [
			account.providerAccountId,
			account.userId
		]);
	},

	async unlinkAccount({ providerAccountId, provider }) {
		if (provider === 'github') {
			await pool.query('UPDATE users SET github_id = NULL WHERE github_id = $1', [
				providerAccountId
			]);
		}
	},

	async createSession(session): Promise<AdapterSession> {
		const { rows } = await pool.query(
			'INSERT INTO sessions (session_token, user_id, expires) VALUES ($1, $2, $3) RETURNING *',
			[session.sessionToken, session.userId, session.expires]
		);

		return {
			sessionToken: rows[0].session_token,
			userId: rows[0].user_id.toString(),
			expires: rows[0].expires
		};
	},

	async getSessionAndUser(
		sessionToken: string
	): Promise<{ user: AdapterUser; session: AdapterSession } | null> {
		if (!sessionToken) return null;

		const { rows } = await pool.query(
			`SELECT 
                s.*, 
                u.id as user_id,
                u.username as name,
                u.email,
                u.password_hash,
                u.street_address,
                u.city,
                u.state,
                u.postal_code,
                u.country
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.session_token = $1 AND s.expires > NOW()`,
			[sessionToken]
		);

		if (!rows[0]) return null;

		// Store the additional user data in the session metadata
		const session: AdapterSession = {
			sessionToken: rows[0].session_token,
			userId: rows[0].user_id.toString(),
			expires: rows[0].expires
		};

		// Return only the fields that AdapterUser expects
		const user: AdapterUser = {
			id: rows[0].user_id.toString(),
			name: rows[0].name,
			email: rows[0].email,
			emailVerified: null,
			image: null
		};

		return { user, session };
	},

	async updateSession(session) {
		const { rows } = await pool.query(
			'UPDATE sessions SET expires = $1 WHERE session_token = $2 RETURNING *',
			[session.expires, session.sessionToken]
		);

		if (!rows[0]) return null;

		return {
			sessionToken: rows[0].session_token,
			userId: rows[0].user_id.toString(),
			expires: rows[0].expires
		};
	},

	async deleteSession(sessionToken) {
		await pool.query('DELETE FROM sessions WHERE session_token = $1', [sessionToken]);
	},

	async createVerificationToken(token) {
		const { rows } = await pool.query(
			'INSERT INTO verification_tokens (identifier, token, expires) VALUES ($1, $2, $3) RETURNING *',
			[token.identifier, token.token, token.expires]
		);
		return rows[0];
	},

	async useVerificationToken({ identifier, token }) {
		const { rows } = await pool.query(
			'DELETE FROM verification_tokens WHERE identifier = $1 AND token = $2 RETURNING *',
			[identifier, token]
		);
		return rows[0] || null;
	}
};
