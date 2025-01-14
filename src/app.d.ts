/// <reference types="@sveltejs/kit" />
// See https://kit.svelte.dev/docs/types#app
import '@auth/core/types';

declare global {
	namespace App {
		interface Address {
			street_address: string;
			city: string;
			state: string;
			postal_code: string;
			country: string;
		}
		interface User {
			id?: string
			name?: string | null
			email?: string | null
			image?: string | null
		  }

		interface ExtendedUser extends User {
			hasPassword?: boolean;
			address?: Address;
		}

		interface Locals {
			session: {
				user: ExtendedUser;
			} | null;
		}

		interface PageData {
			session: {
				user: ExtendedUser;
			} | null;
		}

		interface Platform {
			env: {
				TMDB_API_KEY: string;
			}
		}
	}
}

// Extend auth module
declare module '@auth/core/types' {
	interface Session {
		user: User & {
			hasPassword?: boolean;
			address?: App.Address;
		};
	}

	interface User {
		hasPassword?: boolean;
		address?: App.Address;
	}
}

export {};
