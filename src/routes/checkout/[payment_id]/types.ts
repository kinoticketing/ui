export interface Ticket {
	id: number;
	seat_id: number;
	seat_label: string;
	row: number;
	column: number;
	price: number;
	ticket_code: string;
	screening_id: number;
	category_name: string;
}

export interface Payment {
	id: number;
	amount: number;
	status: string;
}

export interface Movie {
	title: string;
	poster_url: string;
	imdb_id: string;
}

export interface Screening {
	id: number;
	time: string;
	movie: Movie;
	tickets: Ticket[];
}

export interface PaymentData {
	payment_id: number;
	amount: string;
	payment_status: string;
	tickets: Ticket[];
	screening_id: number;
	screening_time: string;
	title: string;
	poster_url: string;
	imdb_id: string;
	is_expired: boolean;
}

export interface PageData {
	payment: Payment;
	tickets: Ticket[];
	movie: Movie;
	screenings: Screening[];
}

// Route params type
export interface CheckoutParams {
	payment_id: string;
}
