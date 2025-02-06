import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Pool } from 'pg';
import type { Session } from '@auth/sveltekit';

// Mock session data
const mockSession: Session = {
    user: {
        id: 'github|123',
        name: 'Test User',
        email: 'test@example.com'
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
};

// Mock the pg Pool
vi.mock('pg', () => {
    const mockConnect = vi.fn(() => ({
        query: vi.fn(),
        release: vi.fn()
    }));
    
    const Pool = vi.fn(() => ({
        connect: mockConnect,
        query: vi.fn()
    }));

    return {
        __esModule: true,
        default: { Pool },
        Pool
    };
});

// Mock auth
vi.mock('@auth/sveltekit', () => ({
    getSession: vi.fn(() => Promise.resolve(mockSession))
}));

describe('Ticket Booking E2E Flow', () => {
    let mockPool: any;
    let mockFetch: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockPool = new Pool();
        mockFetch = vi.fn();
        global.fetch = mockFetch;
    });

    it('should successfully complete ticket booking flow', async () => {
        // Mock API responses
        mockFetch
            // Login response
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true })
            })
            // Movies list
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ([{
                    id: 'movie1',
                    title: 'Test Movie',
                    showTimes: ['2024-03-20T18:00:00Z']
                }])
            })
            // Seat selection
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    availableSeats: ['A1', 'A2', 'A3']
                })
            })
            // Reservation creation
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    reservationId: 'res123',
                    totalAmount: 30.00
                })
            })
            // Payment processing
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    paymentId: 'pay123',
                    status: 'completed'
                })
            })
            // Booking confirmation
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    bookingId: 'book123',
                    status: 'confirmed'
                })
            });

        // Execute booking flow
        // 1. Login
        const loginResponse = await fetch('/api/auth/github');
        expect(loginResponse.ok).toBe(true);

        // 2. Get movies
        const moviesResponse = await fetch('/api/movies');
        const movies = await moviesResponse.json();
        expect(movies).toHaveLength(1);

        // 3. Select seats
        const seatsResponse = await fetch('/api/movies/movie1/seats');
        const seatsData = await seatsResponse.json();
        expect(seatsData.availableSeats).toContain('A1');

        // 4. Create reservation
        const reservationResponse = await fetch('/api/reservations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                movieId: 'movie1',
                showTime: '2024-03-20T18:00:00Z',
                seats: ['A1']
            })
        });
        const reservationData = await reservationResponse.json();
        expect(reservationData.reservationId).toBeTruthy();

        // 5. Process payment
        const paymentResponse = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                reservationId: reservationData.reservationId,
                amount: reservationData.totalAmount
            })
        });
        const paymentData = await paymentResponse.json();
        expect(paymentData.status).toBe('completed');

        // 6. Confirm booking
        const confirmationResponse = await fetch(`/api/bookings/${reservationData.reservationId}/confirm`, {
            method: 'POST'
        });
        const confirmationData = await confirmationResponse.json();
        expect(confirmationData.status).toBe('confirmed');

        // Verify all API calls were made
        expect(mockFetch).toHaveBeenCalledTimes(6);
    });

    it('should handle unavailable seats', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 409,
            json: async () => ({
                error: 'Seats no longer available'
            })
        });

        const response = await fetch('/api/reservations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                movieId: 'movie1',
                showTime: '2024-03-20T18:00:00Z',
                seats: ['A1']
            })
        });

        expect(response.ok).toBe(false);
        const data = await response.json();
        expect(data.error).toBe('Seats no longer available');
    });

    it('should handle payment failures', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 400,
            json: async () => ({
                error: 'Payment failed'
            })
        });

        const response = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                reservationId: 'res123',
                amount: 30.00
            })
        });

        expect(response.ok).toBe(false);
        const data = await response.json();
        expect(data.error).toBe('Payment failed');
    });
});