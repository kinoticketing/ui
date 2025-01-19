import { describe, it, expect, vi } from 'vitest';
import { load } from './+page.server';
import { redirect } from '@sveltejs/kit';

describe('login success page server', () => {
    it('should redirect to login if user is not authenticated', async () => {
        const mockLocals = {
            getSession: vi.fn().mockResolvedValue(null)
        };

        try {
            await load({ locals: mockLocals } as any);
            fail('Expected redirect to be thrown');
        } catch (error: any) {
            expect(error).toEqual(
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
            getSession: vi.fn().mockResolvedValue(mockSession)
        };

        const result = await load({ locals: mockLocals } as any);

        expect(result).toEqual({
            session: mockSession
        });
    });
});
