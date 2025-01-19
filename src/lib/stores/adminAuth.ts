// src/lib/stores/adminAuth.ts
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { ADMIN_CODE } from '$env/static/private';

function createAdminAuthStore() {
	// Initialize the store with the value from localStorage if it exists
	const initialValue = browser && localStorage.getItem('adminAuthenticated') === 'true';
	const { subscribe, set } = writable<boolean>(initialValue);

	return {
		subscribe,
		login: (code: string) => {
			const isAuthenticated = code === ADMIN_CODE;
			if (isAuthenticated && browser) {
				localStorage.setItem('adminAuthenticated', 'true');
			}
			set(isAuthenticated);
			return isAuthenticated;
		},
		logout: () => {
			if (browser) {
				localStorage.removeItem('adminAuthenticated');
			}
			set(false);
		}
	};
}

export const adminAuth = createAdminAuthStore();
