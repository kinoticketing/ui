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
            mockQuery.mockResolvedValueOnce({
                rows: [{
                    id: 1,
                    name: 'Test Hall',
                    total_rows: 5,
                    total_columns: 6
                }],
                rowCount: 1
            });

            mockQuery.mockResolvedValueOnce({
                rows: [{
                    row_number: 1,
                    column_number: 1,
                    seat_label: 'A1',
                    status: 'active',
                    category_id: 1,
                    category_name: 'Standard',
                    price_modifier: 1.0
                }],
                rowCount: 1
            });

            const result = await load({
                params: { hall_id: '1' }
            } as any);

            expect(result).toBeDefined();
            expect(result).toMatchObject({
                hall: {
                    id: 1,
                    name: 'Test Hall',
                    total_rows: 5,
                    total_columns: 6,
                    seat_plan: expect.any(Array)
                }
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
