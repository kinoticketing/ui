import { handle as authHandle } from '$lib/auth';
import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

const sessionHandle: Handle = async ({ event, resolve }) => {
	const session = await event.locals.auth();
	const path = event.url.pathname;

	const protectedRoutes = ['/auth/account', '/reservations'];

	if (protectedRoutes.some((route) => path.startsWith(route)) && !session) {
		throw redirect(303, '/auth/login');
	}

	return resolve(event);
};

export const handle = sequence(authHandle, sessionHandle);
