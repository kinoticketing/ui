import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';
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

describe('create screening endpoints', () => {
    let mockQuery: any;
    let mockConnect: any;
    let mockClient: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockQuery = vi.mocked(Pool)().query;
        mockConnect = vi.mocked(Pool)().connect;
        mockClient = {
            query: vi.fn(),
            release: vi.fn()
        };
        mockConnect.mockResolvedValue(mockClient);
    });

    describe('load function', () => {
        it('should return active halls', async () => {
            const mockHalls = [
                { id: 1, name: 'Hall 1' },
                { id: 2, name: 'Hall 2' }
            ];

            mockQuery.mockResolvedValueOnce({ rows: mockHalls });

            const result = await load({
                // Add empty object as event argument
                url: new URL('http://localhost'),
                params: {},
                route: { id: '' }
            } as any);

            expect(result).toEqual({ halls: mockHalls });
            expect(mockQuery).toHaveBeenCalledTimes(1);
            expect(mockQuery.mock.calls[0][0]).toContain('SELECT id, name');
            expect(mockQuery.mock.calls[0][0]).toContain('FROM halls');
        });

        it('should handle database errors and return empty halls array', async () => {
            mockQuery.mockRejectedValueOnce(new Error('Database error'));

            const result = await load({
                // Add empty object as event argument
                url: new URL('http://localhost'),
                params: {},
                route: { id: '' }
            } as any);
            
            expect(result).toEqual({ halls: [] });
        });
    });

    describe('default action', () => {
        it('should validate required fields', async () => {
            const formData = new FormData();
            // Not adding required fields

            const result = await actions.default({
                request: new Request('http://localhost', {
                    method: 'POST',
                    body: formData
                })
            } as any);

            expect(result).toEqual(
                fail(400, {
                    message: 'Please fill in all fields.',
                    values: { movie_id: undefined, hall_id: NaN, start_time: undefined }
                })
            );
        });

        it('should successfully create a screening', async () => {
            const formData = new FormData();
            formData.append('movie_id', 'tt1234567');
            formData.append('hall_id', '1');
            formData.append('start_time', '2024-02-01T10:00');

            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ end_time: '2024-02-01T12:00' }] }) // Calculate end_time
                .mockResolvedValueOnce({ rows: [] }) // Check overlap
                .mockResolvedValueOnce({ rows: [{ count: '10' }] }) // Check active seats
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Insert screening
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            const result = await actions.default({
                request: new Request('http://localhost', {
                    method: 'POST',
                    body: formData
                })
            } as any);

            expect(result).toEqual({
                success: true,
                message: 'Screening successfully created!'
            });
            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
            expect(mockClient.release).toHaveBeenCalled();
        });

        it('should handle overlapping screenings', async () => {
            const formData = new FormData();
            formData.append('movie_id', 'tt1234567');
            formData.append('hall_id', '1');
            formData.append('start_time', '2024-02-01T10:00');

            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ end_time: '2024-02-01T12:00' }] }) // Calculate end_time
                .mockResolvedValueOnce({ rows: [{ id: 2 }] }); // Overlapping screening found

            const result = await actions.default({
                request: new Request('http://localhost', {
                    method: 'POST',
                    body: formData
                })
            } as any);

            expect(result).toEqual(
                fail(400, {
                    message: 'There is already a screening scheduled in this hall during this time.',
                    values: {
                        movie_id: 'tt1234567',
                        hall_id: 1,
                        start_time: '2024-02-01T10:00'
                    }
                })
            );
            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
        });

        it('should handle halls with no active seats', async () => {
            const formData = new FormData();
            formData.append('movie_id', 'tt1234567');
            formData.append('hall_id', '1');
            formData.append('start_time', '2024-02-01T10:00');

            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [{ end_time: '2024-02-01T12:00' }] }) // Calculate end_time
                .mockResolvedValueOnce({ rows: [] }) // No overlap
                .mockResolvedValueOnce({ rows: [{ count: '0' }] }); // No active seats

            const result = await actions.default({
                request: new Request('http://localhost', {
                    method: 'POST',
                    body: formData
                })
            } as any);

            expect(result).toEqual(
                fail(400, {
                    message: 'Selected hall has no active seats configured.',
                    values: {
                        movie_id: 'tt1234567',
                        hall_id: 1,
                        start_time: '2024-02-01T10:00'
                    }
                })
            );
            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
        });

        it('should handle database errors', async () => {
            const formData = new FormData();
            formData.append('movie_id', 'tt1234567');
            formData.append('hall_id', '1');
            formData.append('start_time', '2024-02-01T10:00');

            mockClient.query.mockRejectedValueOnce(new Error('Database error'));

            const result = await actions.default({
                request: new Request('http://localhost', {
                    method: 'POST',
                    body: formData
                })
            } as any);

            expect(result).toEqual(
                fail(500, {
                    message: 'Error saving the screening. Please try again.',
                    values: {
                        movie_id: 'tt1234567',
                        hall_id: 1,
                        start_time: '2024-02-01T10:00'
                    }
                })
            );
        });
    });
});
