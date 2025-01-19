import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT } from './+server';
import { getUserAddress, updateUserAddress } from '$lib/neonAdapter';

// Mock neonAdapter functions
vi.mock('$lib/neonAdapter', () => ({
    getUserAddress: vi.fn(),
    updateUserAddress: vi.fn()
}));

describe('User Address API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET endpoint', () => {
        it('should reject unauthorized requests', async () => {
            const response = await GET({
                locals: { getSession: () => Promise.resolve(null) }
            } as any);

            expect(response.status).toBe(401);
            expect(await response.text()).toBe('Unauthorized');
        });

        it('should return user address successfully', async () => {
            const mockAddress = {
                street: 'Test Street 1',
                city: 'Test City',
                postalCode: '12345'
            };

            vi.mocked(getUserAddress).mockResolvedValueOnce(mockAddress);

            const response = await GET({
                locals: { getSession: () => Promise.resolve({ user: { id: 'user123' } }) }
            } as any);

            const result = await response.json();
            expect(response.status).toBe(200);
            expect(result).toEqual(mockAddress);
            expect(getUserAddress).toHaveBeenCalledWith('user123');
        });

        it('should handle database errors', async () => {
            vi.mocked(getUserAddress).mockRejectedValueOnce(new Error('Database error'));

            const response = await GET({
                locals: { getSession: () => Promise.resolve({ user: { id: 'user123' } }) }
            } as any);

            expect(response.status).toBe(500);
            expect(await response.text()).toBe('Internal Server Error');
        });
    });

    describe('PUT endpoint', () => {
        it('should reject unauthorized requests', async () => {
            const response = await PUT({
                locals: { getSession: () => Promise.resolve(null) },
                request: new Request('http://localhost', {
                    method: 'PUT',
                    body: JSON.stringify({})
                })
            } as any);

            expect(response.status).toBe(401);
            expect(await response.text()).toBe('Unauthorized');
        });

        it('should update address successfully', async () => {
            const mockAddress = {
                street: 'New Street 1',
                city: 'New City',
                postalCode: '54321'
            };

            vi.mocked(updateUserAddress).mockResolvedValueOnce(mockAddress);

            const response = await PUT({
                locals: { getSession: () => Promise.resolve({ user: { id: 'user123' } }) },
                request: new Request('http://localhost', {
                    method: 'PUT',
                    body: JSON.stringify(mockAddress)
                })
            } as any);

            const result = await response.json();
            expect(response.status).toBe(200);
            expect(result).toEqual(mockAddress);
            expect(updateUserAddress).toHaveBeenCalledWith('user123', mockAddress);
        });

        it('should handle database errors during update', async () => {
            vi.mocked(updateUserAddress).mockRejectedValueOnce(new Error('Database error'));

            const response = await PUT({
                locals: { getSession: () => Promise.resolve({ user: { id: 'user123' } }) },
                request: new Request('http://localhost', {
                    method: 'PUT',
                    body: JSON.stringify({
                        street: 'Test Street',
                        city: 'Test City',
                        postalCode: '12345'
                    })
                })
            } as any);

            expect(response.status).toBe(500);
            expect(await response.text()).toBe('Internal Server Error');
        });
    });
});
