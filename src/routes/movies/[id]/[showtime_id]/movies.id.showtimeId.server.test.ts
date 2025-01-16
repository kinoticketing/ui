import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load } from './+page.server';

// Define interfaces for type safety
interface SeatCategory {
    id: number;
    name: string;
    description: string;
    price_modifier: number;
}

interface Seat {
    id: number;
    seat_label: string;
    row_number: number;
    column_number: number;
    category: SeatCategory;
    isBooked: boolean;
}

interface Hall {
    id: string;
    name: string;
    total_rows: number;
    total_columns: number;
    seatPlan: (Seat | null)[][];
}

interface Movie {
    imdb_id: string;
    title: string;
    duration: number;
}

interface Screening {
    id: string;
    hall_id: string;
    movie_id: string;
    start_time: string;
    end_time: string;
    created_at: string;
    updated_at: string;
    hall: Hall;
}

interface PageData {
    movie: Movie;
    screening: Screening;
}

// Mock data
const movieData: Movie = {
    imdb_id: 'tt1234567',
    title: 'Test Movie',
    duration: 120
};

const screeningData = {
    id: '123',
    hall_id: 'hall1',
    movie_id: 'tt1234567',
    start_time: '2024-01-20T18:00:00Z',
    end_time: '2024-01-20T20:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    name: 'Main Hall',
    total_rows: 2,
    total_columns: 2,
    seats: [
        {
            id: 1,
            seat_label: 'A1',
            row_number: 1,
            column_number: 1,
            category: {
                id: 1,
                name: 'Standard',
                description: 'Standard Seat',
                price_modifier: 1.0
            },
            isBooked: false
        }
    ]
};

// Mock the pg Pool
let mockQueryImplementation: any;

vi.mock('pg', () => {
    const Pool = vi.fn(() => ({
        query: vi.fn().mockImplementation(async (...args) => mockQueryImplementation(...args)),
        end: vi.fn(),
    }));

    return {
        default: {
            Pool
        },
        Pool
    };
});

// Mock @sveltejs/kit error function
vi.mock('@sveltejs/kit', () => ({
    error: (status: number, message: string) => ({ status, body: { message } })
}));

describe('Movie Screening Page Load', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default successful query implementation
        mockQueryImplementation = vi.fn((query: string) => {
            if (query.includes('SELECT * FROM movies')) {
                return Promise.resolve({ rows: [movieData] });
            }
            if (query.includes('screenings s')) {
                return Promise.resolve({ rows: [screeningData] });
            }
            return Promise.resolve({ rows: [] });
        });
    });

    it('should load movie and screening data successfully', async () => {
        const result = await load({ params: { id: 'tt1234567', showtime_id: '123' } } as any) as PageData;

        expect(result.movie).toMatchObject({
            imdb_id: 'tt1234567',
            title: 'Test Movie',
            duration: 120
        });

        expect(result.screening).toMatchObject({
            id: '123',
            start_time: '2024-01-20T18:00:00Z',
            end_time: '2024-01-20T20:00:00Z'
        });

        expect(result.screening.hall.seatPlan).toBeDefined();
        expect(Array.isArray(result.screening.hall.seatPlan)).toBe(true);
    });

    it('should handle movie not found', async () => {
        mockQueryImplementation = vi.fn((query: string) => {
            if (query.includes('SELECT * FROM movies')) {
                return Promise.resolve({ rows: [] });
            }
            return Promise.resolve({ rows: [] });
        });

        await expect(load({ params: { id: 'nonexistent', showtime_id: '123' } } as any))
            .rejects.toEqual({ status: 500, body: { message: 'Error loading movie and screening data' } });
    });

    it('should handle screening not found', async () => {
        mockQueryImplementation = vi.fn((query: string) => {
            if (query.includes('SELECT * FROM movies')) {
                return Promise.resolve({ rows: [movieData] });
            }
            if (query.includes('screenings s')) {
                return Promise.resolve({ rows: [] });
            }
            return Promise.resolve({ rows: [] });
        });

        await expect(load({ params: { id: 'tt1234567', showtime_id: 'nonexistent' } } as any))
            .rejects.toEqual({ status: 500, body: { message: 'Error loading movie and screening data' } });
    });

    it('should handle database errors', async () => {
        mockQueryImplementation = vi.fn().mockRejectedValue(new Error('Database error'));

        await expect(load({ params: { id: 'tt1234567', showtime_id: '123' } } as any))
            .rejects.toEqual({ status: 500, body: { message: 'Error loading movie and screening data' } });
    });
});