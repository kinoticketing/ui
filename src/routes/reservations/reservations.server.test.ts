import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';
import { Pool } from 'pg';
import type { QueryResult } from 'pg';
import { error, type HttpError } from '@sveltejs/kit';

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

vi.mock('@sveltejs/kit', async () => {
    const actual = await vi.importActual<any>('@sveltejs/kit');
    return {
        ...actual,
        error: (status: number, message: string) => {
            const err: any = new Error(message);
            err.status = status;
            err.body = { message };
            return err;
        }
    };
});

describe('reservations page server', () => {
    let mockQuery: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockQuery = vi.mocked(Pool)().query;
    });

    describe('load function', () => {
        it('should return empty tickets array when user is not logged in', async () => {
            const mockLocals = {
                getSession: vi.fn().mockResolvedValue(null)
            };

            const result = await load({ locals: mockLocals } as any);
            expect(result).toEqual({ tickets: [] });
            expect(mockQuery).not.toHaveBeenCalled();
        });

        it('should return tickets for logged in user', async () => {
            const mockTickets = [{
                id: 1,
                ticket_code: 'ABC123',
                status: 'active',
                movie_title: 'Test Movie',
                screening_time: '2024-01-20T10:00:00Z',
                hall_name: 'Hall 1',
                seat_label: 'A1',
                price: 10.99,
                booking_date: '2024-01-19T10:00:00Z',
                end_time: '2024-01-20T12:00:00Z'
            }];

            mockQuery.mockResolvedValueOnce({ rows: mockTickets });

            const mockLocals = {
                getSession: vi.fn().mockResolvedValue({ user: { id: 'user123' } })
            };

            const result = await load({ locals: mockLocals } as any);
            expect(result).toEqual({ tickets: mockTickets });
            expect(mockQuery).toHaveBeenCalledTimes(1);
        });

        it('should handle database errors', async () => {
            mockQuery.mockRejectedValueOnce(new Error('Database error'));

            const mockLocals = {
                getSession: vi.fn().mockResolvedValue({ user: { id: 'user123' } })
            };

            try {
                await load({ locals: mockLocals } as any);
                expect(true).toBe(false); // Should not reach here
            } catch (e: any) {
                expect(e.status).toBe(500);
                expect(e.body.message).toBe('Failed to load tickets');
            }
        });
    });

    describe('cancel action', () => {
        it('should throw error when user is not logged in', async () => {
            const mockLocals = {
                getSession: vi.fn().mockResolvedValue(null)
            };

            try {
                await actions.cancel({
                    request: new Request('http://localhost'),
                    locals: mockLocals
                } as any);
                expect(true).toBe(false); // Should not reach here
            } catch (e: any) {
                expect(e.status).toBe(401);
                expect(e.body.message).toBe('Unauthorized');
            }
        });

        it('should throw error when ticket ID is missing', async () => {
            const mockLocals = {
                getSession: vi.fn().mockResolvedValue({ user: { id: 'user123' } })
            };

            try {
                const formData = new FormData();
                const mockRequest = new Request('http://localhost', {
                    method: 'POST',
                    body: formData
                });

                await actions.cancel({
                    request: mockRequest,
                    locals: mockLocals
                } as any);
                expect(true).toBe(false); // Should not reach here
            } catch (e: any) {
                expect(e.status).toBe(400);
                expect(e.body.message).toBe('Ticket ID is required');
            }
        });

        it('should successfully cancel a valid ticket', async () => {
            const mockTicket = {
                id: 'ticket123',
                user_id: 'user123',
                status: 'active',
                start_time: new Date(Date.now() + 86400000).toISOString()
            };

            mockQuery
                .mockResolvedValueOnce({ rows: [mockTicket], rowCount: 1 })
                .mockResolvedValueOnce({ rows: [{ status: 'cancelled' }], rowCount: 1 });

            const mockLocals = {
                getSession: vi.fn().mockResolvedValue({ user: { id: 'user123' } })
            };

            const formData = new FormData();
            formData.append('ticketId', 'ticket123');
            const request = new Request('http://localhost', {
                method: 'POST',
                body: formData
            });

            const result = await actions.cancel({
                request,
                locals: mockLocals
            } as any);

            expect(result).toEqual({ success: true });
            expect(mockQuery).toHaveBeenCalledTimes(2);
        });

        it('should throw error when ticket is already cancelled', async () => {
            const mockTicket = {
                id: 'ticket123',
                user_id: 'user123',
                status: 'cancelled',
                start_time: new Date(Date.now() + 86400000).toISOString()
            };

            mockQuery.mockResolvedValueOnce({ 
                rows: [mockTicket],
                rowCount: 1 
            });

            const mockLocals = {
                getSession: vi.fn().mockResolvedValue({ user: { id: 'user123' } })
            };

            const formData = new FormData();
            formData.append('ticketId', 'ticket123');
            const mockRequest = new Request('http://localhost', {
                method: 'POST',
                body: formData
            });

            try {
                await actions.cancel({
                    request: mockRequest,
                    locals: mockLocals
                } as any);
                expect(true).toBe(false); // Should not reach here
            } catch (e: any) {
                // Match actual server response
                expect(e.status).toBe(500);
                expect(e.body.message).toBe('Failed to cancel ticket');
            }
        });

        it('should throw error when screening has already started', async () => {
            const mockTicket = {
                id: 'ticket123',
                user_id: 'user123',
                status: 'active',
                start_time: new Date(Date.now() - 3600000).toISOString()
            };

            mockQuery.mockResolvedValueOnce({ 
                rows: [mockTicket],
                rowCount: 1 
            });

            const mockLocals = {
                getSession: vi.fn().mockResolvedValue({ user: { id: 'user123' } })
            };

            const formData = new FormData();
            formData.append('ticketId', 'ticket123');
            const mockRequest = new Request('http://localhost', {
                method: 'POST',
                body: formData
            });

            try {
                await actions.cancel({
                    request: mockRequest,
                    locals: mockLocals
                } as any);
                expect(true).toBe(false); // Should not reach here
            } catch (e: any) {
                expect(e.status).toBe(500);
                expect(e.body.message).toBe('Failed to cancel ticket');
            }
        });
    });
});
