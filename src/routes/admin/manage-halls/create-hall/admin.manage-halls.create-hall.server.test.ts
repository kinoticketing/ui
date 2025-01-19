import { describe, it, expect, vi, beforeEach } from 'vitest';
import { actions } from './+page.server';
import { Pool } from 'pg';
import { fail } from '@sveltejs/kit';

// Mock the pg Pool
vi.mock('pg', () => {
    const query = vi.fn();
    const mockConnect = vi.fn(() => ({
        query: vi.fn(),
        release: vi.fn(),
    }));
    return {
        __esModule: true,
        default: {
            Pool: vi.fn(() => ({
                query,
                connect: mockConnect
            }))
        },
        Pool: vi.fn(() => ({
            query,
            connect: mockConnect
        }))
    };
});

describe('create hall endpoint', () => {
    let mockPoolQuery: any;
    let mockConnect: any;
    let mockClient: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockPoolQuery = vi.mocked(Pool)().query;
        mockConnect = vi.mocked(Pool)().connect;
        mockClient = {
            query: vi.fn(),
            release: vi.fn()
        };
        mockConnect.mockResolvedValue(mockClient);

        // Mock pool-level category query for getOrCreateSeatCategory
        mockPoolQuery.mockImplementation((query: string, params: any[]) => {
            if (query.includes('SELECT id FROM seat_categories')) {
                const categoryMap: { [key: string]: number } = {
                    'Standard': 1,
                    'VIP': 2,
                    'Disabled': 3
                };
                return Promise.resolve({ rows: [{ id: categoryMap[params[0]] }] });
            }
            return Promise.resolve({ rows: [] });
        });
    });

    it('should handle missing required data', async () => {
        const formData = new FormData();
        // Not adding all required fields

        const result = await actions.create({
            request: new Request('http://localhost', {
                method: 'POST',
                body: formData
            })
        } as any);

        expect(result).toEqual(fail(400, { message: 'Missing required data' }));
        expect(mockConnect).not.toHaveBeenCalled();
    });

    it('should successfully create a hall with seats', async () => {
        const formData = new FormData();
        formData.append('hall_name', 'Test Hall');
        formData.append('row_count', '2');
        formData.append('col_count', '2');
        formData.append('seat_plan', JSON.stringify([
            ['Standard', 'VIP'],
            ['Disabled', 'Standard']
        ]));

        mockClient.query
            .mockResolvedValueOnce({ rows: [] }) // BEGIN
            .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Insert hall
            .mockResolvedValueOnce({ rows: [] }) // First seat insert
            .mockResolvedValueOnce({ rows: [] }) // Second seat insert
            .mockResolvedValueOnce({ rows: [] }) // Third seat insert
            .mockResolvedValueOnce({ rows: [] }) // Fourth seat insert
            .mockResolvedValueOnce({ rows: [] }); // COMMIT

        const result = await actions.create({
            request: new Request('http://localhost', {
                method: 'POST',
                body: formData
            })
        } as any);

        expect(result).toEqual({
            success: true,
            message: 'Hall successfully created!',
            hall_id: 1
        });
        expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
        expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
        expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
        const formData = new FormData();
        formData.append('hall_name', 'Test Hall');
        formData.append('row_count', '2');
        formData.append('col_count', '2');
        formData.append('seat_plan', JSON.stringify([
            ['Standard', 'Standard'],
            ['Standard', 'Standard']
        ]));

        mockClient.query
            .mockResolvedValueOnce({ rows: [] }) // BEGIN
            .mockRejectedValueOnce(new Error('Database error')); // Insert hall fails

        const result = await actions.create({
            request: new Request('http://localhost', {
                method: 'POST',
                body: formData
            })
        } as any);

        expect(result).toEqual(fail(500, { message: 'Error saving hall' }));
        expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
        expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle invalid seat plan JSON', async () => {
        const formData = new FormData();
        formData.append('hall_name', 'Test Hall');
        formData.append('row_count', '2');
        formData.append('col_count', '2');
        formData.append('seat_plan', 'invalid json');

        const result = await actions.create({
            request: new Request('http://localhost', {
                method: 'POST',
                body: formData
            })
        } as any);

        expect(result).toEqual(fail(500, { message: 'Error saving hall' }));
        expect(mockClient.release).toHaveBeenCalled();
    });
});
