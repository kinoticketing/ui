import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const session = await locals.auth();

    // If user is not authenticated, redirect to login page
    if (!session?.user) {
        throw redirect(303, '/auth/login');
    }

    return {
        session
    };
};