import GitHub from '@auth/core/providers/github';
import Credentials from '@auth/core/providers/credentials';
import { SvelteKitAuth } from '@auth/sveltekit';
import { AUTH_SECRET, GITHUB_ID, GITHUB_SECRET } from '$env/static/private';
import { NeonAdapter } from './neonAdapter';
import type { User } from '@auth/core/types';
import bcrypt from 'bcrypt';
import pkg from 'pg';

const { Pool } = pkg;
const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

// Define database user type
interface DatabaseUser extends User {
	password_hash?: string;
	street_address?: string;
	city?: string;
	state?: string;
	postal_code?: string;
	country?: string;
}

// const dev = process.env.NODE_ENV !== 'production';

export const { handle, signIn, signOut } = SvelteKitAuth({
	adapter: NeonAdapter,
	providers: [
		GitHub({
			clientId: GITHUB_ID,
			clientSecret: GITHUB_SECRET
		}),
		Credentials({
			credentials: {
				email: {
					label: 'Email',
					type: 'email',
					placeholder: 'hello@example.com'
				},
				password: {
					label: 'Password',
					type: 'password',
					placeholder: 'Password'
				}
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) {
					return null;
				}

				try {
					const client = await pool.connect();
					const result = await client.query(
						'SELECT id, email, username, password_hash, street_address, city, state, postal_code, country FROM users WHERE email = $1',
						[credentials.email]
					);
					console.log(client, result);
					client.release();

					if (result.rows.length === 0) {
						console.error('User not found:', credentials.email);
						return null;
					}

					const user = result.rows[0];
					console.log('User found:', user);

					if (!user.password_hash) {
						console.error('User has no password hash:', user.email);
						return null;
					}
					const psswrd = String(credentials.password);
					console.log(psswrd);

					const passwordMatch = await bcrypt.compare(psswrd, user.password_hash);

					if (!passwordMatch) {
						return null;
					}

					return {
						id: user.id.toString(),
						email: user.email,
						name: user.username,
						password_hash: user.password_hash,
						street_address: user.street_address,
						city: user.city,
						state: user.state,
						postal_code: user.postal_code,
						country: user.country
					};
				} catch (error) {
					console.error('Error in authorize:', error);
					return null;
				}
			}
		})
	],
	pages: {
		signIn: '/auth/login',
		error: '/auth/error'
	},
	secret: AUTH_SECRET,
	trustHost: true,
	session: {
		strategy: 'jwt',
		maxAge: 15 * 60, // 15 minutes
		updateAge: 5 * 60 // 5 minutes
	},
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
				token.email = user.email ?? undefined;
				token.name = user.name ?? undefined;
				if ('password_hash' in user) {
					token.hasPassword = !!(user as DatabaseUser).password_hash;
				}
				if ('street_address' in user) {
					const dbUser = user as DatabaseUser;
					token.address = {
						street_address: dbUser.street_address ?? '',
						city: dbUser.city ?? '',
						state: dbUser.state ?? '',
						postal_code: dbUser.postal_code ?? '',
						country: dbUser.country ?? ''
					};
				}
			}
			return token;
		},
		async session({ session, token }) {
			if (session?.user) {
				session.user.id = token.id as string;
				session.user.name = token.name ?? undefined;
				session.user.email = token.email ?? '';
				session.user.hasPassword = Boolean(token.hasPassword);
			}
			return session;
		}
	}
});
