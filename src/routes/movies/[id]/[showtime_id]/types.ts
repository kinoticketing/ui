// src/routes/movies/[id]/[showtime_id]/types.ts
export interface SeatCategory {
    id: number;
    name: string;
    description: string | null;
    price_modifier: number;
}

export interface Seat {
    id: number;
    hall_id: number;
    row_number: number;
    column_number: number;
    seat_label: string;
    status: string;
    category_id: number;
    category: SeatCategory;
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
    omdb_id: string | null;
    poster_url: string | null;
    year: number | null;
    genre: string | null;
    director: string | null;
    actors: string | null;
    plot: string | null;
    imdb_rating: number | null;
    imdb_url: string | null;
}

export interface PageData {
    movie: Movie;
    screening: Screening;
    error?: string;
}

// API Response types
export interface PriceBreakdown {
    basePrice: number;
    screeningModifier: number;
    categoryModifier: number;
    categoryName: string;
}

export interface PriceResponse {
    price: number;
    breakdown: PriceBreakdown;
}

export interface SelectedSeat {
    key: string;
    row: number;
    col: number;
    label: string;
    seatId: number;
    price: number;
    categoryName: string;
}