// src/hooks.server.ts
import { handle as authHandle } from '$lib/auth';
import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
	user: process.env.PGUSER,
	host: process.env.PGHOST,
	database: process.env.PGDATABASE,
	password: process.env.PGPASSWORD,
	port: 5432,
	ssl: {
		rejectUnauthorized: false
	}
});

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
	if (
		adminRoutes.some((route) => path.startsWith(route)) &&
		!event.locals.adminAuthenticated &&
		path !== '/admin/login'
	) {
		throw redirect(303, '/admin/login');
	}

	return resolve(event);
};

// Handle seat lock cleanup
const seatLockHandle: Handle = async ({ event, resolve }) => {
	// Clean up expired locks periodically (10% chance to run)
	if (Math.random() < 0.1) {
		try {
			await pool.query(`
                DELETE FROM seat_locks 
                WHERE locked_at < NOW() - INTERVAL '5 minutes'
            `);
		} catch (error) {
			console.error('Error cleaning up expired locks:', error);
		}
	}
	return resolve(event);
};

// Combine all handlers using sequence
export const handle = sequence(authHandle, adminHandle, sessionHandle, seatLockHandle);
