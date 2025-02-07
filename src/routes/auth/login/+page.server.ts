import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Actions } from './$types';
import { signIn } from '@auth/sveltekit/client';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth();

	if (session?.user) {
		throw redirect(303, '/auth/account');
	}

	return {
		session
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const email = formData.get('email')?.toString();
		const password = formData.get('password')?.toString();

		if (!email || !password) {
			return {
				error: true,
				message: 'Email and password are required'
			};
		}

		try {
			const result = await signIn('credentials', {
				email,
				password,
				redirect: false
			});

			if (result && 'error' in result) {
				return {
					error: true,
					message: 'Invalid email or password'
				};
			}

			throw redirect(303, '/auth/login-success');
		} catch (error) {
			if (error instanceof Error) {
				return {
					error: true,
					message: error.message
				};
			}
			return {
				error: true,
				message: 'An unexpected error occurred'
			};
		}
	}
};
