import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';
import { Pool } from 'pg';

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

describe('manage halls page server', () => {
    let mockQuery: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockQuery = vi.mocked(Pool)().query;
    });

    describe('load function', () => {
        it('should return halls with seat plans', async () => {
            const mockHalls = [{
                hall_id: 1,
                name: 'Test Hall',
                capacity: 20,
                total_rows: 4,
                total_columns: 5,
                seat_plan: JSON.stringify([{
                    seat_label: 'A1',
                    category: 'Standard',
                    status: 'active'
                }])
            }];

            mockQuery.mockResolvedValueOnce({ rows: mockHalls });

            const result = await load();
            expect(result).toEqual({ halls: mockHalls });
            expect(mockQuery).toHaveBeenCalledTimes(1);
            expect(mockQuery.mock.calls[0][0]).toContain('SELECT');
            expect(mockQuery.mock.calls[0][0]).toContain('FROM halls');
        });

        it('should handle database errors and return empty halls array', async () => {
            mockQuery.mockRejectedValueOnce(new Error('Database error'));

            const result = await load();
            expect(result).toEqual({ halls: [] });
            expect(mockQuery).toHaveBeenCalledTimes(1);
        });
    });

    describe('delete action', () => {
        it('should successfully delete a hall', async () => {
            mockQuery.mockResolvedValueOnce({ rowCount: 1 });

            const result = await actions.delete({
                params: { hall_id: '1' }
            } as any);

            expect(result).toEqual({ success: true });
            expect(mockQuery).toHaveBeenCalledWith(
                'DELETE FROM halls WHERE id = $1',
                ['1']
            );
        });

        it('should handle deletion errors', async () => {
            mockQuery.mockRejectedValueOnce(new Error('Database error'));

            const result = await actions.delete({
                params: { hall_id: '1' }
            } as any);

            expect(result).toEqual({ success: false });
            expect(mockQuery).toHaveBeenCalledTimes(1);
        });
    });
});
