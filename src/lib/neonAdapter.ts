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

export const NeonAdapter: Adapter = {
	async createUser(user) {
		const { rows } = await pool.query(
			'INSERT INTO users (username, email, github_id) VALUES ($1, $2, $3) RETURNING id, username, email, github_id',
			[user.name, user.email, user.id]
		);
		return rows[0];
	},
	async getUser(id) {
		const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
		return rows[0] || null;
	},
	async getUserByEmail(email) {
		const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
		return rows[0] || null;
	},
	async getUserByAccount({ providerAccountId, provider }) {
		if (provider === 'github') {
			const { rows } = await pool.query('SELECT * FROM users WHERE github_id = $1', [
				providerAccountId
			]);
			return rows[0] || null;
		}
		return null;
	},
	async updateUser(user) {
		const { rows } = await pool.query(
			'UPDATE users SET username = $1, email = $2 WHERE id = $3 RETURNING *',
			[user.name, user.email, user.id]
		);
		return rows[0];
	},
	async deleteUser(userId) {
		await pool.query('DELETE FROM users WHERE id = $1', [userId]);
	},
	async linkAccount(account) {
		// In this case, we're updating the github_id for the user
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
		console.log('Creating session with data:', session);
		try {
			const { rows } = await pool.query(
				'INSERT INTO sessions (session_token, user_id, expires) VALUES ($1, $2, $3) RETURNING id, session_token, user_id, expires',
				[session.sessionToken, session.userId, session.expires]
			);
	
			console.log('Session created in database:', rows[0]);
	
			if (!rows[0]) {
				throw new Error('Failed to create session');
			}
	
			// Return the session in the exact format expected by AdapterSession
			const adaptedSession: AdapterSession = {
				sessionToken: rows[0].session_token,
				userId: rows[0].user_id.toString(), // Ensure userId is a string
				expires: rows[0].expires
			};
	
			return adaptedSession;
		} catch (error) {
			console.error('Error creating session:', error);
			throw error;
		}
	},
	async getSessionAndUser(sessionToken: string | undefined): Promise<{ user: AdapterUser; session: AdapterSession; } | null> {
		console.log('getSessionAndUser called with token:', sessionToken);
		
		if (!sessionToken || sessionToken === 'undefined') {
			console.log('Invalid session token:', sessionToken);
			return null;
		}
	
		try {
			const { rows } = await pool.query(
				`SELECT 
					s.id as session_id,
					s.expires,
					s.session_token,
					s.user_id,
					u.email,
					u.username as name,
					u.github_id,
					u.created_at
				 FROM sessions s
				 JOIN users u ON s.user_id = u.id
				 WHERE s.session_token = $1 AND s.expires > NOW()`,
				[sessionToken]
			);
			
			console.log('getSessionAndUser query result:', rows);
	
			if (rows.length === 0) return null;
	
			const userData = {
				id: rows[0].user_id.toString(),
				name: rows[0].name,
				email: rows[0].email,
				emailVerified: null,
				github_id: rows[0].github_id,
			};
	
			const session = {
				sessionToken: rows[0].session_token,
				userId: rows[0].user_id.toString(),
				expires: rows[0].expires
			};
	
			return {
				user: userData,
				session: session
			};
		} catch (error) {
			console.error('Error in getSessionAndUser:', error);
			return null;
		}
	},
	async updateSession(session) {
		const { rows } = await pool.query(
			'UPDATE sessions SET expires = $1 WHERE session_token = $2 RETURNING id, user_id, expires',
			[session.expires, session.sessionToken]
		);
		return rows[0] || null;
	},
	async deleteSession(sessionToken) {
		await pool.query('DELETE FROM sessions WHERE session_token = $1', [sessionToken]);
	},
	async createVerificationToken(token) {
		const { rows } = await pool.query(
			'INSERT INTO verification_tokens (identifier, token, expires) VALUES ($1, $2, $3) RETURNING identifier, token, expires',
			[token.identifier, token.token, token.expires]
		);
		return rows[0];
	},
	async useVerificationToken({ identifier, token }) {
		const { rows } = await pool.query(
			'DELETE FROM verification_tokens WHERE identifier = $1 AND token = $2 RETURNING identifier, token, expires',
			[identifier, token]
		);
		return rows[0] || null;
	}
};
