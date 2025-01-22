import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { load } from './+page.server';
import { DELETE } from './+server';
import { Pool } from 'pg';

// Mock the pg Pool
vi.mock('pg', () => {
    const query = vi.fn();
    const mockPool = {
        query,
        connect: vi.fn(),
        end: vi.fn(),
        on: vi.fn(),
        removeAllListeners: vi.fn()
    };

    return {
        __esModule: true,
        default: {
            Pool: vi.fn(() => mockPool)
        },
        Pool: vi.fn(() => mockPool)
    };
});

describe('Hall Management Endpoints', () => {
    let mockQuery: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockQuery = vi.mocked(Pool)().query as unknown as ReturnType<typeof vi.fn>;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('DELETE endpoint', () => {
        it('should successfully delete a hall and its related data', async () => {
            mockQuery.mockResolvedValueOnce({ rowCount: 1 }); // BEGIN
            mockQuery.mockResolvedValueOnce({ rowCount: 1 }); // Delete seats
            mockQuery.mockResolvedValueOnce({ rowCount: 1 }); // Delete screenings
            mockQuery.mockResolvedValueOnce({ rowCount: 1 }); // Delete hall
            mockQuery.mockResolvedValueOnce({ rowCount: 1 }); // COMMIT

            const response = await DELETE({
                params: { hall_id: '1' }
            } as any);

            expect(response.status).toBe(204);
        });

        it('should handle deletion errors', async () => {
            mockQuery.mockResolvedValueOnce({ rowCount: 1 }); // BEGIN
            mockQuery.mockRejectedValueOnce(new Error('Database error')); // Delete seats fails
            mockQuery.mockResolvedValueOnce({ rowCount: 1 }); // ROLLBACK

            const response = await DELETE({
                params: { hall_id: '1' }
            } as any);

            expect(response.status).toBe(500);
        });
    });

    describe('load function', () => {
        it('should load hall data successfully', async () => {
            mockQuery
                .mockResolvedValueOnce({
                    rowCount: 1,
                    rows: [{
                        id: 1,
                        name: 'Test Hall',
                        total_rows: 5
                    }]
                })
                .mockResolvedValueOnce({
                    rowCount: 30,
                    rows: Array(30).fill(0).map((_, i) => ({
                        row_number: Math.floor(i / 6) + 1,
                        column_number: (i % 6) + 1,
                        seat_label: `${String.fromCharCode(65 + Math.floor(i / 6))}${(i % 6) + 1}`,
                        status: 'active',
                        category_id: 1,
                        category_name: 'Regular',
                        price_modifier: 1.0,
                        seats_in_row: 6
                    }))
                });

            const result = await load({ params: { hall_id: '1' } });

            expect(result).toBeDefined();
            expect(result).toMatchObject({
                hall: {
                    id: 1,
                    name: 'Test Hall',
                    total_rows: 5,
                    seat_plan: expect.any(Array),
                    total_seats: 30,
                    row_sizes: expect.any(Object)
                }
            });

            // Verify seat plan structure
            const { hall } = result;
            expect(hall?.seat_plan).toHaveLength(5);
            expect(hall?.seat_plan[0]).toHaveLength(6);
            expect(hall?.seat_plan[0][0]).toMatchObject({
                label: 'A1',
                status: 'active',
                category: 'Regular',
                category_id: 1,
                priceModifier: 1.0
            });
        });

        it('should handle non-existent hall', async () => {
            mockQuery.mockResolvedValueOnce({
                rows: [],
                rowCount: 0
            });

            const result = await load({
                params: { hall_id: '999' }
            } as any);

            expect(result).toEqual({
                hall: null,
                error: 'Hall with ID 999 not found'
            });
        });

        it('should handle database errors', async () => {
            mockQuery.mockRejectedValueOnce(new Error('Database error'));

            const result = await load({
                params: { hall_id: '1' }
            } as any);

            expect(result).toEqual({
                hall: null,
                error: 'Failed to load hall data'
            });
        });
    });
});
