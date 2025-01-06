import GitHub from '@auth/core/providers/github';
import { SvelteKitAuth } from '@auth/sveltekit';
import { AUTH_SECRET, GITHUB_ID, GITHUB_SECRET } from '$env/static/private';

export const { handle, signIn, signOut } = SvelteKitAuth({
	providers: [GitHub({ clientId: GITHUB_ID, clientSecret: GITHUB_SECRET })],
	secret: AUTH_SECRET,
	callbacks: {
		session({ session, token }) {
			if (session.user) {
				session.user.id = token.sub ?? '';
			}
			return session;
		}
	}
});
