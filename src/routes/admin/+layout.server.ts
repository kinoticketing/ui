import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// Skip authentication check for the login page
	if (url.pathname === '/admin/login') {
		return {};
	}

	if (!locals.adminAuthenticated) {
		throw redirect(303, '/admin/login');
	}

	return {};
};
