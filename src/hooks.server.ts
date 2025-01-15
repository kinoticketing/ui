// src/hooks.server.ts
import { handle as authHandle } from '$lib/auth';
import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

// Handle admin authentication
const adminHandle: Handle = async ({ event, resolve }) => {
	// Get admin authentication status from session cookie
	const adminAuthenticated = event.cookies.get('admin_authenticated') === 'true';
	event.locals.adminAuthenticated = adminAuthenticated;

	return resolve(event);
};

const sessionHandle: Handle = async ({ event, resolve }) => {
	const session = await event.locals.auth();
	const path = event.url.pathname;

	// Define protected routes
	const protectedRoutes = ['/auth/account'];
	const adminRoutes = ['/admin'];

	// Check user authentication for protected routes
	if (protectedRoutes.some((route) => path.startsWith(route)) && !session) {
		throw redirect(303, '/auth/login');
	}

	// Check admin authentication for admin routes
	// Skip the check for the admin login page itself
	if (
		adminRoutes.some((route) => path.startsWith(route)) &&
		!event.locals.adminAuthenticated &&
		path !== '/admin/login'
	) {
		throw redirect(303, '/admin/login');
	}

	return resolve(event);
};

// Combine all handlers using sequence
export const handle = sequence(authHandle, adminHandle, sessionHandle);
