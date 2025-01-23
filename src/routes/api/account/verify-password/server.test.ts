import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

// Fix bcrypt mock typing
vi.mock('bcrypt', () => ({
    default: {
        compare: vi.fn().mockImplementation(() => Promise.resolve(true))
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

describe('Password Verification API', () => {
    let mockQuery: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockQuery = vi.mocked(Pool)().query;
        // Update mock implementation instead of return value
        vi.mocked(bcrypt.compare).mockImplementation(() => Promise.resolve(true));
    });

    it('should reject unauthorized requests', async () => {
        const response = await POST({
            locals: {},
            request: new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ password: 'test123' })
            })
        } as any);

        const result = await response.json();
        expect(response.status).toBe(401);
        expect(result).toEqual({ error: 'Unauthorized' });
    });

    it('should require password in request', async () => {
        const response = await POST({
            locals: { userId: 'user123' },
            request: new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({})
            })
        } as any);

        const result = await response.json();
        expect(response.status).toBe(400);
        expect(result).toEqual({ error: 'Password is required' });
    });

    it('should handle non-existent user', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] });

        const response = await POST({
            locals: { userId: 'nonexistent' },
            request: new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ password: 'test123' })
            })
        } as any);

        const result = await response.json();
        expect(response.status).toBe(404);
        expect(result).toEqual({ error: 'User not found' });
    });

    it('should handle user without password set', async () => {
        mockQuery.mockResolvedValueOnce({ 
            rows: [{ password_hash: null }] 
        });

        const response = await POST({
            locals: { userId: 'user123' },
            request: new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ password: 'test123' })
            })
        } as any);

        const result = await response.json();
        expect(response.status).toBe(400);
        expect(result).toEqual({ error: 'No password set' });
    });

    it('should verify correct password', async () => {
        mockQuery.mockResolvedValueOnce({ 
            rows: [{ password_hash: 'hashedPassword123' }] 
        });
        // Update mock implementation for this specific test
        vi.mocked(bcrypt.compare).mockImplementation(() => Promise.resolve(true));

        const response = await POST({
            locals: { userId: 'user123' },
            request: new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ password: 'correctPassword' })
            })
        } as any);

        const result = await response.json();
        expect(response.status).toBe(200);
        expect(result).toEqual({ success: true });
    });

    it('should reject incorrect password', async () => {
        mockQuery.mockResolvedValueOnce({ 
            rows: [{ password_hash: 'hashedPassword123' }] 
        });
        // Update mock implementation for this specific test
        vi.mocked(bcrypt.compare).mockImplementation(() => Promise.resolve(false));

        const response = await POST({
            locals: { userId: 'user123' },
            request: new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ password: 'wrongPassword' })
            })
        } as any);

        const result = await response.json();
        expect(response.status).toBe(401);
        expect(result).toEqual({ error: 'Invalid password' });
    });

    it('should handle database errors', async () => {
        mockQuery.mockRejectedValueOnce(new Error('Database error'));

        const response = await POST({
            locals: { userId: 'user123' },
            request: new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ password: 'test123' })
            })
        } as any);

        const result = await response.json();
        expect(response.status).toBe(500);
        expect(result).toEqual({ error: 'Internal server error' });
    });
});
