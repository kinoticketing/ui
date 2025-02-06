/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { actions } from './+page.server';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { fail } from '@sveltejs/kit';

// Mock bcrypt
vi.mock('bcrypt', () => ({
	default: {
		hash: vi.fn().mockResolvedValue('hashed-password')
	}
}));

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

describe('register page server', () => {
	let mockClient: any;
	let mockConnect: any;

	beforeEach(() => {
		vi.clearAllMocks();
		mockClient = {
			query: vi.fn(),
			release: vi.fn()
		};
		mockConnect = vi.mocked(Pool)().connect;
		mockConnect.mockResolvedValue(mockClient);
	});

	describe('default action', () => {
		it('should fail if required fields are missing', async () => {
			const formData = new FormData();
			formData.append('username', 'testuser'); // Missing email and password

			const result = await actions.default({
				request: new Request('http://localhost', {
					method: 'POST',
					body: formData
				})
			} as any);

			expect(result).toEqual(
				fail(400, {
					message: 'All fields are required',
					username: 'testuser',
					email: undefined
				})
			);
		});

		it('should fail if passwords do not match', async () => {
			const formData = new FormData();
			formData.append('username', 'testuser');
			formData.append('email', 'test@example.com');
			formData.append('password', 'password123');
			formData.append('confirmPassword', 'password456');

			const result = await actions.default({
				request: new Request('http://localhost', {
					method: 'POST',
					body: formData
				})
			} as any);

			expect(result).toEqual(
				fail(400, {
					message: 'Passwords do not match',
					username: 'testuser',
					email: 'test@example.com'
				})
			);
		});

		it('should fail if username or email already exists', async () => {
			const formData = new FormData();
			formData.append('username', 'existinguser');
			formData.append('email', 'existing@test.com');
			formData.append('password', 'password123');
			formData.append('confirmPassword', 'password123');

			mockClient.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

			const result = await actions.default({
				request: new Request('http://localhost', {
					method: 'POST',
					body: formData
				})
			} as any);

			expect(result).toEqual(
				fail(400, {
					message: 'Username or email already exists',
					username: 'existinguser',
					email: 'existing@test.com'
				})
			);
			expect(mockClient.release).toHaveBeenCalled();
		});

		it('should successfully register a new user', async () => {
			const formData = new FormData();
			formData.append('username', 'newuser');
			formData.append('email', 'new@test.com');
			formData.append('password', 'password123');
			formData.append('confirmPassword', 'password123');

			mockClient.query
				.mockResolvedValueOnce({ rows: [] }) // No existing user
				.mockResolvedValueOnce({ rows: [{ id: 1 }] });

			const result = await actions.default({
				request: new Request('http://localhost', {
					method: 'POST',
					body: formData
				})
			} as any);

			expect(result).toEqual({ success: true });
			expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
			expect(mockClient.release).toHaveBeenCalled();
		});

		it('should handle database errors', async () => {
			const formData = new FormData();
			formData.append('username', 'newuser');
			formData.append('email', 'new@test.com');
			formData.append('password', 'password123');
			formData.append('confirmPassword', 'password123');

			mockClient.query.mockRejectedValueOnce(new Error('Database error'));

			const result = await actions.default({
				request: new Request('http://localhost', {
					method: 'POST',
					body: formData
				})
			} as any);

			expect(result).toEqual(
				fail(500, {
					message: 'An error occurred while creating the account',
					username: 'newuser',
					email: 'new@test.com'
				})
			);
		});
	});
});
