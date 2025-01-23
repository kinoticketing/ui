import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NeonAdapter, getUserAddress, updateUserAddress } from './neonAdapter';
import { Pool } from 'pg';
import type { Adapter, AdapterUser, AdapterSession, AdapterAccount } from '@auth/core/adapters';

// Create a properly typed adapter with all required methods
const adapter = {
    ...NeonAdapter,
    // Add missing required methods with default implementations
    getAccount: vi.fn().mockResolvedValue(null),
    getAuthenticator: vi.fn().mockResolvedValue(null),
    createAuthenticator: vi.fn().mockResolvedValue(null),
    listAuthenticatorsByUserId: vi.fn().mockResolvedValue([]),
    updateAuthenticatorCounter: vi.fn().mockResolvedValue(null)
} as Required<Adapter>;

// Mock pg Pool
vi.mock('pg', () => {
    const query = vi.fn();
    const mockConnect = vi.fn(() => ({
        query: vi.fn(),
        release: vi.fn()
    }));
    return {
        __esModule: true,
        default: {
            Pool: vi.fn(() => ({
                query,
                connect: mockConnect
            }))
        },
        Pool: vi.fn(() => ({
            query,
            connect: mockConnect
        }))
    };
});

describe('NeonAdapter', () => {
    let mockQuery: any;
    let mockConnect: any;
    let mockClient: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockClient = {
            query: vi.fn(),
            release: vi.fn()
        };
        mockConnect = vi.mocked(Pool)().connect;
        mockQuery = vi.mocked(Pool)().query;
        mockConnect.mockResolvedValue(mockClient);
    });

    describe('user management', () => {
        it('should create a new user', async () => {
            const mockUser: AdapterUser = {
                name: 'Test User',
                email: 'test@example.com',
                id: 'github123',
                emailVerified: null,
                image: null
            };

            mockQuery.mockResolvedValueOnce({
                rows: [{
                    id: 'user123',
                    name: 'Test User',
                    email: 'test@example.com'
                }]
            });

            const result = await adapter.createUser(mockUser);

            expect(result).toEqual({
                id: 'user123',
                name: 'Test User',
                email: 'test@example.com',
                emailVerified: null,
                image: null
            });
        });

        it('should get user by id', async () => {
            mockQuery.mockResolvedValueOnce({
                rows: [{
                    id: 'user123',
                    name: 'Test User',
                    email: 'test@example.com'
                }]
            });

            const result = await adapter.getUser('user123');

            expect(result).toEqual({
                id: 'user123',
                name: 'Test User',
                email: 'test@example.com',
                emailVerified: null,
                image: null
            });
        });

        it('should return null for non-existent user', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] });

            const result = await adapter.getUser('nonexistent');

            expect(result).toBeNull();
        });

        it('should get user by email', async () => {
            mockQuery.mockResolvedValueOnce({
                rows: [{
                    id: 'user123',
                    name: 'Test User',
                    email: 'test@example.com'
                }]
            });

            const result = await adapter.getUserByEmail('test@example.com');

            expect(result).toEqual({
                id: 'user123',
                name: 'Test User',
                email: 'test@example.com',
                emailVerified: null,
                image: null
            });
        });

        it('should update user data', async () => {
            const updateData = {
                id: 'user123',
                name: 'Updated Name',
                email: 'updated@example.com'
            };

            mockQuery.mockResolvedValueOnce({
                rows: [{
                    id: 'user123',
                    name: 'Updated Name',
                    email: 'updated@example.com'
                }]
            });

            const result = await adapter.updateUser(updateData);

            expect(result).toEqual({
                id: 'user123',
                name: 'Updated Name',
                email: 'updated@example.com',
                emailVerified: null,
                image: null
            });
        });

        it('should delete user', async () => {
            await adapter.deleteUser('user123');
            expect(mockQuery).toHaveBeenCalledWith(
                'DELETE FROM users WHERE id = $1',
                ['user123']
            );
        });
    });

    describe('session management', () => {
        it('should create a new session', async () => {
            const mockSession: AdapterSession = {
                sessionToken: 'token123',
                userId: 'user123',
                expires: new Date('2024-12-31')
            };

            mockQuery.mockResolvedValueOnce({
                rows: [{
                    session_token: 'token123',
                    user_id: 'user123',
                    expires: new Date('2024-12-31')
                }]
            });

            const result = await adapter.createSession(mockSession);

            expect(result).toEqual({
                sessionToken: 'token123',
                userId: 'user123',
                expires: new Date('2024-12-31')
            });
        });

        it('should get session and user data', async () => {
            mockQuery.mockResolvedValueOnce({
                rows: [{
                    session_token: 'token123',
                    user_id: 'user123',
                    expires: new Date('2024-12-31'),
                    name: 'Test User',
                    email: 'test@example.com'
                }]
            });

            const result = await adapter.getSessionAndUser('token123');

            expect(result).toMatchObject({
                session: {
                    sessionToken: 'token123',
                    userId: 'user123'
                },
                user: {
                    id: 'user123',
                    name: 'Test User',
                    email: 'test@example.com'
                }
            });
        });

        it('should update session expiry', async () => {
            const newExpiry = new Date('2024-12-31');
            mockQuery.mockResolvedValueOnce({
                rows: [{
                    session_token: 'token123',
                    user_id: 'user123',
                    expires: newExpiry
                }]
            });

            const result = await adapter.updateSession({
                sessionToken: 'token123',
                expires: newExpiry
            });

            expect(result).toEqual({
                sessionToken: 'token123',
                userId: 'user123',
                expires: newExpiry
            });
        });

        it('should delete session', async () => {
            await adapter.deleteSession('token123');
            expect(mockQuery).toHaveBeenCalledWith(
                'DELETE FROM sessions WHERE session_token = $1',
                ['token123']
            );
        });
    });

    describe('address management', () => {
        it('should get user address', async () => {
            const mockAddress = {
                street_address: '123 Test St',
                postal_code: '12345',
                city: 'Test City',
                state: 'Test State',
                country: 'Test Country'
            };

            mockClient.query.mockResolvedValueOnce({ rows: [mockAddress] });

            const result = await getUserAddress('user123');

            expect(result).toEqual(mockAddress);
            expect(mockClient.release).toHaveBeenCalled();
        });

        it('should update user address', async () => {
            const mockAddress = {
                street_address: '123 Test St',
                postal_code: '12345',
                city: 'Test City',
                state: 'Test State',
                country: 'Test Country'
            };

            mockQuery.mockResolvedValueOnce({ rows: [mockAddress] });

            const result = await updateUserAddress('user123', mockAddress);

            expect(result).toEqual(mockAddress);
            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE users'),
                expect.arrayContaining([mockAddress.street_address])
            );
        });
    });

    describe('verification tokens', () => {
        it('should create verification token', async () => {
            const token = {
                identifier: 'test@example.com',
                token: 'verify123',
                expires: new Date('2024-12-31')
            };

            mockQuery.mockResolvedValueOnce({ rows: [token] });

            const result = await adapter.createVerificationToken(token);
            expect(result).toEqual(token);
        });

        it('should use verification token', async () => {
            const token = {
                identifier: 'test@example.com',
                token: 'verify123'
            };

            mockQuery.mockResolvedValueOnce({
                rows: [{
                    identifier: 'test@example.com',
                    token: 'verify123',
                    expires: new Date('2024-12-31')
                }]
            });

            const result = await adapter.useVerificationToken(token);
            expect(result).toBeTruthy();
            expect(mockQuery).toHaveBeenCalledWith(
                'DELETE FROM verification_tokens WHERE identifier = $1 AND token = $2 RETURNING *',
                [token.identifier, token.token]
            );
        });
    });

    describe('account linking', () => {
        it('should link GitHub account', async () => {
            const account: AdapterAccount = {
                type: 'oauth',
                provider: 'github',
                providerAccountId: 'github123',
                userId: 'user123',
                access_token: 'token123',
                token_type: 'bearer'
            };

            await adapter.linkAccount(account);
            expect(mockQuery).toHaveBeenCalledWith(
                'UPDATE users SET github_id = $1 WHERE id = $2',
                [account.providerAccountId, account.userId]
            );
        });

        it('should unlink GitHub account', async () => {
            const account = {
                provider: 'github',
                providerAccountId: 'github123',
                type: 'oauth'
            };

            await adapter.unlinkAccount(account);
            expect(mockQuery).toHaveBeenCalledWith(
                'UPDATE users SET github_id = NULL WHERE github_id = $1',
                ['github123']
            );
        });
    });
});
