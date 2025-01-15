import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { ADMIN_CODE } from '$env/static/private';


export const actions: Actions = {
	default: async ({ cookies, request }) => {
		const formData = await request.formData();
		const code = formData.get('code');

		if (code === ADMIN_CODE) {
			// Set the admin cookie
			cookies.set('admin_authenticated', 'true', {
				path: '/',
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				maxAge: 60 * 60
			});

			throw redirect(303, '/admin');
		}

		return fail(400, { incorrect: true });
	}
};
