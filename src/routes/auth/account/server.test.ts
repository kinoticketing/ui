import { describe, it, expect, vi } from 'vitest';
import { load } from './+page.server';
import { redirect } from '@sveltejs/kit';

describe('auth account page server', () => {
    it('should redirect to login if user is not authenticated', async () => {
        const mockLocals = {
            auth: vi.fn().mockResolvedValue(null)
        };

        try {
            await load({ locals: mockLocals } as any);
            // If we reach here, the test should fail
            expect(true).toBe(false);
        } catch (e) {
            expect(e).toEqual(
                expect.objectContaining({
                    status: 303,
                    location: '/auth/login'
                })
            );
        }
    });

    it('should return session data for authenticated user', async () => {
        const mockSession = {
            user: {
                id: 'user123',
                email: 'test@example.com'
            }
        };

        const mockLocals = {
            auth: vi.fn().mockResolvedValue(mockSession)
        };

        const result = await load({ locals: mockLocals } as any);

        expect(result).toEqual({
            session: mockSession
        });
    });
});
