// src/lib/stores/cart.ts
import { writable } from 'svelte/store';

export interface CartTicket {
	seatId: number;
	row: number;
	col: number;
	label: string;
	price: number;
	categoryName?: string;
}

export interface CartItem {
	screeningId: number;
	movieTitle: string;
	screeningTime: string;
	tickets: CartTicket[];
	movieImageUrl?: string;
}

function createCartStore() {
	const { subscribe, set, update } = writable<CartItem[]>([]);

	return {
		subscribe,
		addItem: (item: CartItem) => update((items) => [...items, item]),
		removeItem: (screeningId: number) =>
			update((items) => items.filter((item) => item.screeningId !== screeningId)),
		clear: () => set([])
	};
}

export const cart = createCartStore();
