import { describe, it, expect, vi } from 'vitest';
import { load } from './+layout.server';

describe('root layout server load', () => {
    it('should return session when authentication succeeds', async () => {
        const mockSession = {
            user: { id: 'user123', email: 'test@example.com' }
        };

        const event = {
            locals: {
                auth: vi.fn().mockResolvedValue(mockSession)
            }
        };

        const result = await load(event as any);

        expect(result).toEqual({
            session: mockSession
        });
        expect(event.locals.auth).toHaveBeenCalled();
    });

    it('should handle authentication errors gracefully', async () => {
        const event = {
            locals: {
                auth: vi.fn().mockRejectedValue(new Error('Auth failed'))
            }
        };

        const result = await load(event as any);

        expect(result).toEqual({
            session: null
        });
        expect(event.locals.auth).toHaveBeenCalled();
    });
});
