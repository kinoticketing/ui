// src/routes/api/user/address/+server.ts
import { json } from '@sveltejs/kit';
import { getUserAddress, updateUserAddress } from '$lib/neonAdapter';

export async function PUT({ request, locals }) {
	try {
		const session = await locals.getSession();
		if (!session?.user?.id) {
			return new Response('Unauthorized', { status: 401 });
		}

		const address = await request.json();
		const updatedAddress = await updateUserAddress(session.user.id, address);

		return json(updatedAddress);
	} catch (error) {
		console.error('Error updating address:', error);
		return new Response('Internal Server Error', { status: 500 });
	}
}

export async function GET({ locals }) {
	try {
		const session = await locals.getSession();
		if (!session?.user?.id) {
			return new Response('Unauthorized', { status: 401 });
		}

		const address = await getUserAddress(session.user.id);
		return json(address);
	} catch (error) {
		console.error('Error fetching address:', error);
		return new Response('Internal Server Error', { status: 500 });
	}
}
