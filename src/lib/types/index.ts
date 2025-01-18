// src/lib/types/index.ts
export interface Seat {
	id: number;
	seat_label: string;
	row_number: number;
	column_number: number;
	category: {
		id: number;
		name: string;
		description: string;
		price_modifier: number;
	};
	isBooked: boolean;
}

export interface Hall {
	id: number;
	name: string;
	total_rows: number;
	total_columns: number;
	seatPlan: (Seat | null)[][];
}

export interface Screening {
	id: number;
	hall_id: number;
	movie_id: string;
	start_time: string;
	end_time: string;
	hall: Hall;
}

export interface Movie {
	id: number;
	title: string;
	duration: number;
	imdb_id: string;
	poster_url: string;
	year: number;
	genre: string;
	director: string;
	actors: string;
	plot: string;
	imdb_rating: number;
}

export interface CartTicket {
	seatId: number;
	row: number;
	col: number;
	label: string;
	price: number;
	categoryName: string;
}

export interface CartItem {
	screeningId: number;
	movieTitle: string;
	screeningTime: string;
	tickets: CartTicket[];
	movieImageUrl: string;
}

export interface PriceResponse {
	price: number;
	breakdown: {
		basePrice: number;
		screeningModifier: number;
		categoryModifier: number;
		categoryName: string;
	};
}
