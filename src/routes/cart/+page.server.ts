// src/routes/cart/+page.server.ts
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Session } from '@auth/core/types';

export interface PageData {
	session: Session | null;
}

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth();
	if (!session?.user) {
		throw error(401, 'Please login to view cart');
	}

	return {
		session
	};
};
