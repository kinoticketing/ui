import { SvelteKitAuth } from '@auth/sveltekit';
import Google from '@auth/core/providers/google';
import GitHub from '@auth/core/providers/github';

export const { handle, signIn, signOut } = SvelteKitAuth({
	providers: [
		Google({
			clientId: process.env.GOOGLE_API_KEY,
			clientSecret: import.meta.env.GOOGLE_SECRET,
			authorization: {
				params: {
					prompt: 'consent',
					access_type: 'offline',
					response_type: 'code'
				}
			}
		}),
		GitHub({
			clientId: import.meta.env.GITHUB_ID,
			clientSecret: import.meta.env.GITHUB_SECRET,
			authorization: {
				params: {
					scope: 'read:user user:email'
				}
			}
		})
	],
	callbacks: {
		async session({ session, token }) {
			session.user.id = token.sub ?? ''; // without ?? '' before
			session.user.role = token.role as string; // without cast before
			return session;
		},
		async jwt({ token, user }) {
			if (user) {
				token.role = user.role;
			}
			return token;
		}
	},
	pages: {
		signIn: '/auth/login'
	}
});

// Extended types
declare module '@auth/core/types' {
	interface User {
		role?: string;
	}

	interface Session {
		user: User & {
			id: string;
			email: string;
			name?: string;
		};
	}
}
