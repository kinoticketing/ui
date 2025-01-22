import { writable } from 'svelte/store';
import type { CartItem } from '$lib/types';

const CART_STORAGE_KEY = 'cinema_cart';

function createCartStore() {
	// Load initial state from localStorage
	const storedCart =
		typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]') : [];

	const { subscribe, set, update } = writable<CartItem[]>(storedCart);

	// Subscribe to changes and update localStorage
	if (typeof window !== 'undefined') {
		subscribe((value) => {
			localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(value));
		});
	}

	return {
		subscribe,
		addItem: (item: CartItem) =>
			update((items) => {
				// Check if screening already exists in cart
				const existingIndex = items.findIndex((i) => i.screeningId === item.screeningId);
				if (existingIndex >= 0) {
					// Merge tickets if screening exists
					const updatedItems = [...items];
					updatedItems[existingIndex] = {
						...items[existingIndex],
						tickets: [...items[existingIndex].tickets, ...item.tickets]
					};
					return updatedItems;
				}
				return [...items, item];
			}),
		removeItem: (screeningId: number) =>
			update((items) => items.filter((item) => item.screeningId !== screeningId)),
		removeTicket: (screeningId: number, seatId: number) =>
			update((items) => {
				const screening = items.find((item) => item.screeningId === screeningId);
				if (!screening) return items;

				const updatedTickets = screening.tickets.filter((ticket) => ticket.seatId !== seatId);
				if (updatedTickets.length === 0) {
					return items.filter((item) => item.screeningId !== screeningId);
				}

				return items.map((item) =>
					item.screeningId === screeningId ? { ...item, tickets: updatedTickets } : item
				);
			}),
		getItems: () => {
			let items: CartItem[] = [];
			subscribe((value) => {
				items = value;
			})();
			return items;
		},
		clear: () => set([])
	};
}

export const cart = createCartStore();
