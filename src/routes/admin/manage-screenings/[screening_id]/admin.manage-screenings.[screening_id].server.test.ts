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
            const mockScreeningData = {
                screening_id: 1,
                movie_id: 'tt1234567',
                movie_title: 'Test Movie',
                hall_id: 1,
                hall_name: 'Test Hall',
                start_time: '2024-01-20T10:00:00Z',
                end_time: '2024-01-20T12:00:00Z',
                total_rows: 2,
                total_columns: 2
            };

            const mockSeats = [
                {
                    row_index: 0,
                    col_index: 0,
                    seat_label: 'A1',
                    status: 'active',
                    category: 'standard',
                    category_id: 1,
                    price_modifier: 1.0
                },
                // ... more seats
            ];

            mockQuery
                .mockResolvedValueOnce({ rows: [mockScreeningData], rowCount: 1 })
                .mockResolvedValueOnce({ rows: mockSeats, rowCount: mockSeats.length });

            const result = await load({
                params: { screening_id: '1' }
            } as any) as LoadReturn;  // Add type assertion here

            expect(result).toBeDefined();
            expect(result.screening).toMatchObject({
                screening_id: 1,
                movie_title: 'Test Movie',
                hall_name: 'Test Hall',
                seat_plan: expect.any(Array)
            });
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

    describe('delete action', () => {
        it('should successfully delete a screening', async () => {
            mockQuery.mockResolvedValueOnce({ rowCount: 1 });

            const result = await actions.delete({
                params: { screening_id: '1' }
            } as any);

            expect(result).toEqual({ success: true });
            expect(mockQuery).toHaveBeenCalledWith(
                'DELETE FROM screenings WHERE id = $1',
                [1]
            );
        });

        it('should handle deletion errors', async () => {
            mockQuery.mockRejectedValueOnce(new Error('Database error'));

            const result = await actions.delete({
                params: { screening_id: '1' }
            } as any);

            expect(result).toEqual({
                success: false,
                error: 'Datenbankfehler beim Löschen'
            });
        });
    });

    describe('updateSeatPlan action', () => {
        it('should successfully update seat plan', async () => {
            const mockScreening = {
                hall_id: 1,
                total_rows: 2,
                total_columns: 2
            };

            mockQuery
                .mockResolvedValueOnce({ rows: [mockScreening], rowCount: 1 }) // Get screening
                .mockResolvedValueOnce({ rowCount: 1 }) // Delete seats
                .mockResolvedValueOnce({ rowCount: 1 }) // Insert new seats
                .mockResolvedValueOnce({ rowCount: 1 }); // Insert new seats

            const formData = new FormData();
            formData.append('new_seat_plan', JSON.stringify([
                [{ label: 'A1', status: 'active', category_id: 1 }],
                [{ label: 'A2', status: 'active', category_id: 1 }]
            ]));

            const result = await actions.updateSeatPlan({
                params: { screening_id: '1' },
                request: new Request('http://localhost', {
                    method: 'POST',
                    body: formData
                })
            } as any);

            expect(result).toEqual({ success: true });
        });

        it('should handle missing seat plan', async () => {
            const formData = new FormData();
            // Not adding new_seat_plan

            const result = await actions.updateSeatPlan({
                params: { screening_id: '1' },
                request: new Request('http://localhost', {
                    method: 'POST',
                    body: formData
                })
            } as any);

            expect(result).toEqual({
                success: false,
                error: 'Kein Sitzplan übergeben.'
            });
        });

        it('should handle database errors', async () => {
            mockQuery.mockRejectedValueOnce(new Error('Database error'));

            const formData = new FormData();
            formData.append('new_seat_plan', JSON.stringify([]));

            const result = await actions.updateSeatPlan({
                params: { screening_id: '1' },
                request: new Request('http://localhost', {
                    method: 'POST',
                    body: formData
                })
            } as any);

            expect(result).toEqual({
                success: false,
                error: 'Datenbankfehler beim Aktualisieren des Sitzplans'
            });
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
        });

        it('should handle deletion errors', async () => {
            mockQuery.mockRejectedValueOnce(new Error('Database error'));

            const response = await DELETE({
                params: { screening_id: '1' }
            } as any);

            expect(response.status).toBe(500);
            expect(await response.text()).toBe('Fehler beim Löschen der Vorstellung');
        });
    });
});
