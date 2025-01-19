import GitHub from '@auth/core/providers/github';
import { SvelteKitAuth } from '@auth/sveltekit';
import { AUTH_SECRET, GITHUB_ID, GITHUB_SECRET } from '$env/static/private';
import { NeonAdapter } from './neonAdapter';
import type { Session, User } from '@auth/core/types';

// Define database user type
interface DatabaseUser {
	id: string;
	password_hash?: string | null;
	street_address?: string | null;
	city?: string | null;
	state?: string | null;
	postal_code?: string | null;
	country?: string | null;
}

// Define the extended types
interface ExtendedUser extends User {
	hasPassword?: boolean;
	address?: {
		street_address: string;
		city: string;
		state: string;
		postal_code: string;
		country: string;
	};
}

interface ExtendedSession extends Session {
	user: ExtendedUser;
}

const dev = process.env.NODE_ENV !== 'production';

export const { handle, signIn, signOut } = SvelteKitAuth({
	adapter: NeonAdapter,
	providers: [
		GitHub({
			clientId: GITHUB_ID,
			clientSecret: GITHUB_SECRET
		})
	],
	secret: AUTH_SECRET,
	trustHost: true,
	session: {
		strategy: 'database',
		maxAge: 15 * 60, // 15 min
		updateAge: 5 * 60 // 5min
	},
	cookies: {
		sessionToken: {
			name: dev ? 'next-auth.session-token' : '__Secure-next-auth.session-token',
			options: {
				httpOnly: true,
				sameSite: 'lax',
				path: '/',
				secure: !dev
			}
		}
	},
	callbacks: {
		async session({ session, user }: { session: ExtendedSession; user: DatabaseUser }) {
			if (session?.user) {
				session.user.id = user.id;
				session.user.hasPassword = !!user.password_hash;

				if (user.street_address) {
					// Only create address object if we have a street address
					session.user.address = {
						street_address: user.street_address,
						city: user.city ?? '',
						state: user.state ?? '',
						postal_code: user.postal_code ?? '',
						country: user.country ?? ''
					};
				}
			}
			return session;
		}
	}
});
