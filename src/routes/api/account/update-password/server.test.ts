import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

// Fix bcrypt mock typing
vi.mock('bcrypt', () => ({
    default: {
        compare: vi.fn().mockImplementation(() => Promise.resolve(true)),
        hash: vi.fn().mockImplementation(() => Promise.resolve('hashedPassword123'))
    }
}));

// Mock pg Pool
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

describe('Password Update API', () => {
    let mockQuery: any;
    
    beforeEach(() => {
        vi.clearAllMocks();
        mockQuery = vi.mocked(Pool)().query;
        // Update mock implementations instead of return values
        vi.mocked(bcrypt.compare).mockImplementation(() => Promise.resolve(true));
        vi.mocked(bcrypt.hash).mockImplementation(() => Promise.resolve('hashedPassword123'));
    });

    describe('POST handler', () => {
        it('should reject unauthorized requests', async () => {
            const response = await POST({
                locals: {},
                request: new Request('http://localhost', {
                    method: 'POST',
                    body: JSON.stringify({
                        newPassword: 'NewPass123!'
                    })
                })
            } as any);

            const result = await response.json();
            expect(response.status).toBe(401);
            expect(result).toEqual({ error: 'Unauthorized' });
        });

        it('should validate password requirements', async () => {
            const response = await POST({
                locals: { userId: 'user123' },
                request: new Request('http://localhost', {
                    method: 'POST',
                    body: JSON.stringify({
                        newPassword: 'weak'
                    })
                })
            } as any);

            const result = await response.json();
            expect(response.status).toBe(400);
            expect(result.error).toContain('Password must be at least 8 characters');
        });

        it('should handle first-time password creation', async () => {
            mockQuery
                .mockResolvedValueOnce({ rows: [{ password_hash: null }] }) // No existing password
                .mockResolvedValueOnce({ rowCount: 1 }); // Update successful

            const response = await POST({
                locals: { userId: 'user123' },
                request: new Request('http://localhost', {
                    method: 'POST',
                    body: JSON.stringify({
                        newPassword: 'ValidNewPass123!'
                    })
                })
            } as any);

            const result = await response.json();
            expect(response.status).toBe(200);
            expect(result.message).toBe('Password created successfully');
        });

        it('should require current password for updates', async () => {
            mockQuery.mockResolvedValueOnce({ 
                rows: [{ password_hash: 'existingHash' }] 
            });

            const response = await POST({
                locals: { userId: 'user123' },
                request: new Request('http://localhost', {
                    method: 'POST',
                    body: JSON.stringify({
                        newPassword: 'ValidNewPass123!'
                    })
                })
            } as any);

            const result = await response.json();
            expect(response.status).toBe(400);
            expect(result.error).toBe('Current password is required');
        });

        it('should verify current password before update', async () => {
            mockQuery.mockResolvedValueOnce({ 
                rows: [{ password_hash: 'existingHash' }] 
            });
            // Update mock for this specific test
            vi.mocked(bcrypt.compare).mockImplementation(() => Promise.resolve(false));

            const response = await POST({
                locals: { userId: 'user123' },
                request: new Request('http://localhost', {
                    method: 'POST',
                    body: JSON.stringify({
                        currentPassword: 'WrongPass123!',
                        newPassword: 'ValidNewPass123!'
                    })
                })
            } as any);

            const result = await response.json();
            expect(response.status).toBe(401);
            expect(result.error).toBe('Current password is incorrect');
        });

        it('should successfully update existing password', async () => {
            mockQuery
                .mockResolvedValueOnce({ rows: [{ password_hash: 'existingHash' }] })
                .mockResolvedValueOnce({ rowCount: 1 });
            // Update mock for this specific test    
            vi.mocked(bcrypt.compare).mockImplementation(() => Promise.resolve(true));

            const response = await POST({
                locals: { userId: 'user123' },
                request: new Request('http://localhost', {
                    method: 'POST',
                    body: JSON.stringify({
                        currentPassword: 'CurrentPass123!',
                        newPassword: 'ValidNewPass123!'
                    })
                })
            } as any);

            const result = await response.json();
            expect(response.status).toBe(200);
            expect(result.message).toBe('Password updated successfully');
        });

        it('should handle database errors', async () => {
            mockQuery.mockRejectedValueOnce(new Error('Database error'));

            const response = await POST({
                locals: { userId: 'user123' },
                request: new Request('http://localhost', {
                    method: 'POST',
                    body: JSON.stringify({
                        newPassword: 'ValidNewPass123!'
                    })
                })
            } as any);

            const result = await response.json();
            expect(response.status).toBe(500);
            expect(result.error).toBe('Internal server error');
        });
    });
});
