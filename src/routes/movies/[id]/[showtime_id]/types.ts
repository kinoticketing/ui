export interface Seat {
    label: string;
    status: string;
    isBooked: boolean;
    row: number;
    column: number;
}

export interface Hall {
    id: number;
    name: string;
    seatPlan: (Seat | null)[][];
}

export interface Screening {
    id: number;
    startTime: Date;
    endTime: Date;
    hall: Hall;
}

export interface Movie {
    id: number;
    title: string;
    duration: number;
}

export interface PageData {
    movie: Movie;
    screening: Screening;
    error?: string;
}