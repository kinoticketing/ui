import { describe, it, expect, vi } from 'vitest';
import { load } from './+layout.server';
import { redirect } from '@sveltejs/kit';

// Mock redirect to return a consistent object structure
vi.mock('@sveltejs/kit', async () => {
    const actual = await vi.importActual('@sveltejs/kit');
    return {
        ...actual,
        redirect: (status: number, location: string) => ({
            status,
            location
        })
    };
});

describe('admin layout server', () => {
    describe('load function', () => {
        it('should allow access to login page', async () => {
            const result = await load({
                locals: {},
                url: new URL('http://localhost/admin/login')
            } as any);

            expect(result).toEqual({});
        });

        it('should redirect unauthenticated users to login', async () => {
            try {
                await load({
                    locals: { adminAuthenticated: false },
                    url: new URL('http://localhost/admin/dashboard')
                } as any);
                expect(true).toBe(false); // Should not reach here
            } catch (e: any) {
                expect(e.status).toBe(303);
                expect(e.location).toBe('/admin/login');
            }
        });

        it('should allow access to authenticated users', async () => {
            const result = await load({
                locals: { adminAuthenticated: true },
                url: new URL('http://localhost/admin/dashboard')
            } as any);

            expect(result).toEqual({});
        });

        it('should handle different admin routes for authenticated users', async () => {
            const routes = [
                '/admin/manage-halls',
                '/admin/manage-screenings',
                '/admin/manage-reservations'
            ];

            for (const route of routes) {
                const result = await load({
                    locals: { adminAuthenticated: true },
                    url: new URL(`http://localhost${route}`)
                } as any);

                expect(result).toEqual({});
            }
        });

        it('should redirect unauthenticated users from all admin routes', async () => {
            const routes = [
                '/admin/manage-halls',
                '/admin/manage-screenings',
                '/admin/manage-reservations'
            ];

            for (const route of routes) {
                try {
                    await load({
                        locals: { adminAuthenticated: false },
                        url: new URL(`http://localhost${route}`)
                    } as any);
                    expect(true).toBe(false); // Should not reach here
                } catch (e: any) {
                    expect(e.status).toBe(303);
                    expect(e.location).toBe('/admin/login');
                }
            }
        });
    });
});
