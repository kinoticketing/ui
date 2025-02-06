import { writable } from 'svelte/store';
import type { CartItem } from '$lib/types';

const CART_STORAGE_KEY = 'cinema_cart';
const CART_EXPIRY_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

function isExpired(timestamp: number): boolean {
	return Date.now() - timestamp > CART_EXPIRY_TIME;
}

function createCartStore() {
	// Load initial state from localStorage and clean expired items
	let storedCart: CartItem[] = [];
	if (typeof window !== 'undefined') {
		const stored = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
		storedCart = stored.filter((item: CartItem) => !isExpired(item.addedAt));
	}

	const { subscribe, set, update } = writable<CartItem[]>(storedCart);

	// Set up periodic cleanup if in browser
	let cleanupInterval: ReturnType<typeof setInterval>;
	if (typeof window !== 'undefined') {
		// Subscribe to changes and update localStorage
		subscribe((value) => {
			localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(value));
		});

		// Set up interval to clean expired items
		cleanupInterval = setInterval(() => {
			update((items) => {
				const newItems = items.filter((item) => !isExpired(item.addedAt));
				if (newItems.length !== items.length) {
					// If items were removed, unlock the corresponding seats
					const removedItems = items.filter((item) => isExpired(item.addedAt));
					removedItems.forEach((item) => {
						item.tickets.forEach((ticket) => {
							fetch(`/api/seats/${ticket.seatId}/lock`, {
								method: 'DELETE'
							}).catch((error) => {
								console.error('Error unlocking expired seat:', error);
							});
						});
					});
				}
				return newItems;
			});
		}, 60000); // Check every minute
	}

	return {
		subscribe,
		addItem: (item: Omit<CartItem, 'addedAt'>) =>
			update((items) => {
				// First clean expired items
				items = items.filter((item) => !isExpired(item.addedAt));

				// Add timestamp to new item
				const itemWithTimestamp = {
					...item,
					addedAt: Date.now()
				};

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
				return [...items, itemWithTimestamp];
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
				// Clean expired items before returning
				items = value.filter((item) => !isExpired(item.addedAt));
			})();
			return items;
		},
		clear: () => set([]),
		cleanup: () => {
			if (typeof window !== 'undefined' && cleanupInterval) {
				clearInterval(cleanupInterval);
			}
		}
	};
}

export const cart = createCartStore();
