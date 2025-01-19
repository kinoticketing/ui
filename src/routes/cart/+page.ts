export interface CartItem {
	id: number;
	title: string;
	screening: string;
	seats: string[];
	price: number;
	imageUrl: string;
}

export interface PageData {
	cartItems: CartItem[];
}

export function load(): PageData {
	// This would normally fetch from your backend
	return {
		cartItems: [
			{
				id: 1,
				title: 'The Dark Knight',
				screening: 'Today at 20:00',
				seats: ['A1', 'A2'],
				price: 24.0,
				imageUrl: ''
			},
			{
				id: 2,
				title: 'Inception',
				screening: 'Tomorrow at 18:30',
				seats: ['B5'],
				price: 12.0,
				imageUrl: ''
			}
		]
	};
}
