import { describe, it, expect, vi } from 'vitest';
import { load } from './+page.server';
import { redirect } from '@sveltejs/kit';

describe('auth login page server', () => {
    it('should redirect to account page if user is already authenticated', async () => {
        const mockLocals = {
            auth: vi.fn().mockResolvedValue({
                user: { id: 'user123', email: 'test@example.com' }
            })
        };

        try {
            await load({ locals: mockLocals } as any);
            expect(true).toBe(false); // Alternative to fail()
        } catch (error: any) {
            expect(error).toEqual(
                expect.objectContaining({
                    status: 303,
                    location: '/auth/account'
                })
            );
        }
    });

    it('should return session data for unauthenticated user', async () => {
        const mockLocals = {
            auth: vi.fn().mockResolvedValue(null)
        };

        const result = await load({ locals: mockLocals } as any);

        expect(result).toEqual({
            session: null
        });
    });
});
