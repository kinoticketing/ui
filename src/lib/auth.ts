import GitHub from '@auth/core/providers/github';
import { SvelteKitAuth } from '@auth/sveltekit';
import { AUTH_SECRET, GITHUB_ID, GITHUB_SECRET } from '$env/static/private';
import { NeonAdapter } from './neonAdapter';

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
		async session({ session, user }) {
			console.log('Session callback:', { session, user });
			if (session?.user) {
				session.user.id = user.id?.toString();
			}
			return session;
		}
	},
	events: {
		async signIn(message) {
			console.log('Sign in event:', message);
		},
		async session(message) {
			console.log('Session event:', message);
		},
		async createUser(message) {
			console.log('Create user event:', message);
		}
	},
	debug: true
});
