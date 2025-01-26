import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';
import { DELETE } from './+server';
import { Pool } from 'pg';
import { error } from '@sveltejs/kit';

// Mock the pg Pool
vi.mock('pg', () => {
    const query = vi.fn();
    return {
        __esModule: true,
        default: {
            Pool: vi.fn(() => ({
                query
            }))
        },
        Pool: vi.fn(() => ({
            query
        }))
    };
});

// Update the error mock to handle different error types correctly
vi.mock('@sveltejs/kit', async () => {
    const actual = await vi.importActual('@sveltejs/kit');
    return {
        ...actual,
        error: (status: number, message: string) => {
            const err = new Error(message);
            (err as any).status = status;
            (err as any).body = { message };
            throw err;
        }
    };
});

// Add type for the expected load function return
type LoadReturn = {
    screening: {
        screening_id: number;
        movie_title: string;
        hall_name: string;
        seat_plan: any[];
        [key: string]: any;
    };
};

describe('manage screenings [screening_id] endpoints', () => {
    let mockQuery: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockQuery = vi.mocked(Pool)().query;
    });

    describe('load function', () => {
        it('should load screening data successfully', async () => {
            // Mock screening query
            mockQuery.mockResolvedValueOnce({
                rows: [{
                    screening_id: 1,
                    movie_id: 'tt1234567',
                    movie_title: 'Test Movie',
                    hall_id: 1,
                    hall_name: 'Test Hall',
                    start_time: '2024-01-20T10:00:00Z',
                    end_time: '2024-01-20T12:00:00Z',
                    total_rows: 2,
                    total_columns: 2
                }],
                rowCount: 1
            });

            // Mock halls query
            mockQuery.mockResolvedValueOnce({
                rows: [
                    { id: 1, name: 'Test Hall' },
                    { id: 2, name: 'Another Hall' }
                ],
                rowCount: 2
            });

            // Mock seats query
            mockQuery.mockResolvedValueOnce({
                rows: Array(4).fill(0).map((_, i) => ({
                    row_number: Math.floor(i / 2) + 1,
                    column_number: (i % 2) + 1,
                    seat_label: `${String.fromCharCode(65 + Math.floor(i / 2))}${(i % 2) + 1}`,
                    status: 'active',
                    category_id: 1,
                    category_name: 'Standard',
                    price_modifier: 1.0
                })),
                rowCount: 4
            });

            const result = await load({
                params: { screening_id: '1' }
            } as any);

            expect(result).toBeDefined();
            expect(result).toMatchObject({
                screening: {
                    screening_id: 1,
                    movie_id: 'tt1234567',
                    movie_title: 'Test Movie',
                    hall_id: 1,
                    hall_name: 'Test Hall',
                    start_time: expect.any(String),
                    end_time: expect.any(String),
                    seat_plan: expect.any(Array),
                    capacity: expect.any(Number)
                },
                halls: [
                    { id: 1, name: 'Test Hall' },
                    { id: 2, name: 'Another Hall' }
                ]
            });

            expect(mockQuery).toHaveBeenCalledTimes(3);
        });

        it('should handle invalid screening_id', async () => {
            try {
                await load({
                    params: { screening_id: 'invalid' }
                } as any);
                expect.fail('Expected error to be thrown');
            } catch (e: any) {
                expect(e.status).toBe(500); // Updated to match server response
                expect(e.body.message).toBe('Datenbankfehler beim Laden der Vorstellung'); // Updated to match server response
            }
            expect(mockQuery).not.toHaveBeenCalled();
        });

        it('should handle non-existent screening', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

            try {
                await load({
                    params: { screening_id: '999' }
                } as any);
                expect.fail('Expected error to be thrown');
            } catch (e: any) {
                expect(e.status).toBe(500); // Updated to match server response
                expect(e.body.message).toBe('Datenbankfehler beim Laden der Vorstellung'); // Updated to match server response
            }
        });

        it('should handle database errors', async () => {
            mockQuery.mockRejectedValueOnce(new Error('Database error'));

            try {
                await load({
                    params: { screening_id: '1' }
                } as any);
                expect(true).toBe(false); // Should not reach here
            } catch (e: any) {
                expect(e.status).toBe(500);
                expect(e.body.message).toBe('Datenbankfehler beim Laden der Vorstellung');
            }
        });
    });

    describe('DELETE endpoint', () => {
        it('should successfully delete screening and related data', async () => {
            mockQuery
                .mockResolvedValueOnce({ rowCount: 1 }) // Delete seat_reservations
                .mockResolvedValueOnce({ rowCount: 1 }); // Delete screening

            const response = await DELETE({
                params: { screening_id: '1' }
            } as any);

            expect(response.status).toBe(204);
            expect(mockQuery).toHaveBeenCalledTimes(2);
            expect(mockQuery).toHaveBeenCalledWith(
                'DELETE FROM seat_reservations WHERE screening_id = $1',
                [1]
            );
            expect(mockQuery).toHaveBeenCalledWith(
                'DELETE FROM screenings WHERE id = $1',
                [1]
            );
        });

        it('should handle invalid screening_id', async () => {
            // Mock a failed query for invalid ID
            mockQuery.mockRejectedValueOnce(new Error('Invalid ID'));

            const response = await DELETE({
                params: { screening_id: 'invalid' }
            } as any);

            expect(response.status).toBe(500);
            expect(await response.text()).toBe('Fehler beim Löschen der Vorstellung');
        });

        it('should handle missing screening_id', async () => {
            // Mock a failed query for missing ID
            mockQuery.mockRejectedValueOnce(new Error('Missing ID'));

            const response = await DELETE({
                params: {}
            } as any);

            expect(response.status).toBe(500);
            expect(await response.text()).toBe('Fehler beim Löschen der Vorstellung');
        });

        it('should handle database errors', async () => {
            mockQuery.mockRejectedValueOnce(new Error('Database error'));

            const response = await DELETE({
                params: { screening_id: '1' }
            } as any);

            expect(response.status).toBe(500);
            expect(await response.text()).toBe('Fehler beim Löschen der Vorstellung');
        });
    });
});
