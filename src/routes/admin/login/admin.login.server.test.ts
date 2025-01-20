import { describe, it, expect, vi } from 'vitest';
import { actions } from './+page.server';
import { redirect } from '@sveltejs/kit';

// Mock environment variables
vi.mock('$env/static/private', () => ({
    ADMIN_CODE: 'test-admin-code'
}));

// Mock redirect
vi.mock('@sveltejs/kit', async () => {
    const actual = await vi.importActual('@sveltejs/kit');
    return {
        ...actual,
        redirect: (status: number, location: string) => {
            return { status, location };
        }
    };
});

describe('admin login', () => {
    describe('default action', () => {
        it('should set cookie and redirect on correct code', async () => {
            const mockCookies = {
                set: vi.fn()
            };

            const formData = new FormData();
            formData.append('code', 'test-admin-code');

            const mockRequest = new Request('http://localhost', {
                method: 'POST',
                body: formData
            });

            try {
                await actions.default({
                    cookies: mockCookies,
                    request: mockRequest
                } as any);
                expect(true).toBe(false); // Should not reach here due to redirect
            } catch (e: any) {
                expect(e).toEqual({
                    status: 303,
                    location: '/admin'
                });
                expect(mockCookies.set).toHaveBeenCalledWith(
                    'admin_authenticated',
                    'true',
                    expect.objectContaining({
                        path: '/',
                        httpOnly: true,
                        sameSite: 'lax',
                        maxAge: 60 * 60
                    })
                );
            }
        });

        it('should return fail action on incorrect code', async () => {
            const mockCookies = {
                set: vi.fn()
            };

            const formData = new FormData();
            formData.append('code', 'wrong-code');

            const mockRequest = new Request('http://localhost', {
                method: 'POST',
                body: formData
            });

            const result = await actions.default({
                cookies: mockCookies,
                request: mockRequest
            } as any);

            expect(result).toEqual({
                status: 400,
                data: { incorrect: true }
            });
            expect(mockCookies.set).not.toHaveBeenCalled();
        });

        it('should handle missing code', async () => {
            const mockCookies = {
                set: vi.fn()
            };

            const formData = new FormData();
            const mockRequest = new Request('http://localhost', {
                method: 'POST',
                body: formData
            });

            const result = await actions.default({
                cookies: mockCookies,
                request: mockRequest
            } as any);

            expect(result).toEqual({
                status: 400,
                data: { incorrect: true }
            });
            expect(mockCookies.set).not.toHaveBeenCalled();
        });
    });
});
