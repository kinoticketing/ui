<script lang="ts">
	import Icon from '@iconify/svelte';
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	export let data: PageData;

	let showChangePassword = false;
	let currentPassword = '';
	let newPassword = '';
	let confirmPassword = '';
	let passwordError = '';
	let passwordSuccess = '';
	let loadingPassword = false;
	let showEditAddress = false;

	let address = $page.data.session?.user?.address || {
		street_address: '',
		city: '',
		state: '',
		postal_code: '',
		country: ''
	};

	onMount(async () => {
		if ($page.data.session?.user) {
			try {
				const response = await fetch('/api/user/address');
				if (response.ok) {
					address = await response.json();
				} else {
					console.error('Failed to fetch address');
				}
			} catch (error) {
				console.error('Error:', error);
			}
		}
	});

	async function handlePasswordSubmit() {
		try {
			passwordError = '';
			passwordSuccess = '';
			loadingPassword = true;

			if (newPassword !== confirmPassword) {
				passwordError = 'Passwords do not match.';
				return;
			}

			const response = await fetch('/api/account/update-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					currentPassword: $page.data.session?.user?.hasPassword ? currentPassword : null,
					newPassword
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error);
			}

			passwordSuccess = result.message;
			showChangePassword = false;
			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
		} catch (error) {
			console.error('Error:', error);
			passwordError = error instanceof Error ? error.message : 'Failed to update password';
		} finally {
			loadingPassword = false;
		}
	}

	async function handleUpdateAddress() {
		try {
			const response = await fetch('/api/user/address', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(address)
			});

			if (!response.ok) {
				throw new Error('Failed to update address');
			}

			showEditAddress = false;
			await goto($page.url.pathname, { replaceState: true });
		} catch (error) {
			console.error('Error updating address:', error);
		}
	}
</script>

<main>
	<div class="container">
		<button class="back-button" on:click={() => goto('/')}>
			<Icon icon="mdi:arrow-left" width="20" height="20" />
			Back to Home
		</button>

		<h1 class="account-title">Account Settings</h1>

		{#if $page.data.session}
			<div class="content-container">
				<!-- Left side - User Info and Password -->
				<div class="details-section">
					<div class="details-container">
						<div class="user-info">
							<h2 class="section-title">Personal Information</h2>
							{#if data.session && data.session.user}
								<div class="info-grid">
									<div class="info-column">
										<div class="info-item">
											<span class="info-label">Email</span>
											<span class="info-value">{data.session.user.email}</span>
										</div>
										<div class="info-item">
											<span class="info-label">Name</span>
											<span class="info-value">{data.session.user.name || 'Not provided'}</span>
										</div>
									</div>

									{#if !showEditAddress && $page.data.session?.user?.address}
										<div class="info-column">
											<div class="info-item">
												<span class="info-label">Street Address</span>
												<span class="info-value"
													>{$page.data.session.user.address.street_address}</span
												>
											</div>

											<div class="info-item">
												<span class="info-label">City, State & ZIP</span>
												<span class="info-value">
													{$page.data.session.user.address.city}, {$page.data.session.user.address
														.state}
													{$page.data.session.user.address.postal_code}
												</span>
											</div>
											<div class="info-item">
												<span class="info-label">Country</span>
												<span class="info-value">{$page.data.session.user.address.country}</span>
											</div>
										</div>
									{/if}
								</div>
								<div class="actions-grid">
									<button class="view-reservations-button" on:click={() => goto('/reservations')}>
										<Icon icon="mdi:ticket-account" width="20" height="20" />
										View My Reservations
									</button>
								</div>
							{/if}
						</div>

						<div class="password-section">
							<h2 class="section-title">Password Settings</h2>
							{#if !$page.data.session?.user?.hasPassword}
								{#if !showChangePassword}
									<button class="action-button" on:click={() => (showChangePassword = true)}>
										<Icon icon="mdi:key-plus" width="20" height="20" />
										Create Password
									</button>
								{/if}
							{:else if !showChangePassword}
								<button class="action-button" on:click={() => (showChangePassword = true)}>
									<Icon icon="mdi:key-change" width="20" height="20" />
									Change Password
								</button>
							{/if}

							{#if showChangePassword}
								<form class="form-container" on:submit|preventDefault={handlePasswordSubmit}>
									{#if $page.data.session?.user?.hasPassword}
										<div class="form-group">
											<label for="current-password">Current Password</label>
											<input
												type="password"
												id="current-password"
												bind:value={currentPassword}
												required
											/>
										</div>
									{/if}
									<div class="form-group">
										<label for="new-password">New Password</label>
										<input type="password" id="new-password" bind:value={newPassword} required />
									</div>
									<div class="form-group">
										<label for="confirm-password">Confirm Password</label>
										<input
											type="password"
											id="confirm-password"
											bind:value={confirmPassword}
											required
										/>
									</div>

									{#if passwordError}
										<div class="error-message">{passwordError}</div>
									{/if}
									{#if passwordSuccess}
										<div class="success-message">{passwordSuccess}</div>
									{/if}

									<div class="button-group">
										<button
											type="button"
											class="secondary-button"
											on:click={() => (showChangePassword = false)}
										>
											Cancel
										</button>
										<button type="submit" class="primary-button" disabled={loadingPassword}>
											{loadingPassword ? 'Loading...' : 'Update Password'}
										</button>
									</div>
								</form>
							{/if}
						</div>
					</div>
				</div>

				<!-- Right side - Address -->
				<div class="address-section">
					<div class="address-container">
						<h2 class="section-title">Address Information</h2>
						{#if !showEditAddress && $page.data.session?.user?.address}
							<div class="address-display">
								<div class="info-item">
									<span class="info-label">Street Address</span>
									<span class="info-value">{$page.data.session.user.address.street_address}</span>
								</div>
								<div class="info-item">
									<span class="info-label">City</span>
									<span class="info-value">{$page.data.session.user.address.city}</span>
								</div>
								<div class="info-item">
									<span class="info-label">State</span>
									<span class="info-value">{$page.data.session.user.address.state}</span>
								</div>
								<div class="info-item">
									<span class="info-label">Postal Code</span>
									<span class="info-value">{$page.data.session.user.address.postal_code}</span>
								</div>
								<div class="info-item">
									<span class="info-label">Country</span>
									<span class="info-value">{$page.data.session.user.address.country}</span>
								</div>
								<button class="action-button mt-4" on:click={() => (showEditAddress = true)}>
									<Icon icon="mdi:pencil" width="20" height="20" />
									Edit Address
								</button>
							</div>
						{:else}
							<div class="form-wrapper">
								<form class="form-container" on:submit|preventDefault={handleUpdateAddress}>
									<div class="form-group">
										<label for="street">Street Address</label>
										<input type="text" id="street" bind:value={address.street_address} required />
									</div>
									<div class="form-group">
										<label for="city">City</label>
										<input type="text" id="city" bind:value={address.city} required />
									</div>
									<div class="form-group">
										<label for="state">State</label>
										<input type="text" id="state" bind:value={address.state} required />
									</div>
									<div class="form-group">
										<label for="postal">Postal Code</label>
										<input type="text" id="postal" bind:value={address.postal_code} required />
									</div>
									<div class="form-group">
										<label for="country">Country</label>
										<input type="text" id="country" bind:value={address.country} required />
									</div>
									<div class="button-group">
										<button
											type="button"
											class="secondary-button"
											on:click={() => (showEditAddress = false)}
										>
											Cancel
										</button>
										<button type="submit" class="primary-button">Update Address</button>
									</div>
								</form>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{:else}
			<div class="login-prompt">
				<p>Please log in to view your account information.</p>
				<button type="button" class="primary-button" on:click={() => goto('/login')}>
					Login
				</button>
			</div>
		{/if}
	</div>
</main>

<style>
	main {
		min-height: 100vh;
		background-color: #f8f9fa;
		padding: 2rem 1rem;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		position: relative;
	}

	.back-button {
		position: absolute;
		left: 0;
		top: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		background-color: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		color: #374151;
		font-weight: 500;
		transition: all 0.2s ease;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.back-button:hover {
		background-color: #f3f4f6;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.account-title {
		font-size: 2rem;
		font-weight: 600;
		color: #1a1a1a;
		margin-bottom: 2rem;
		text-align: center;
	}

	.content-container {
		display: flex;
		gap: 2rem;
		align-items: flex-start;
	}

	.details-section {
		flex: 3;
	}

	.details-container,
	.address-container {
		background: white;
		padding: 2rem 2rem 2rem 2rem;
		border-radius: 1rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.address-section {
		flex: 2;
		position: sticky;
		top: 2rem;
	}
	.actions-grid {
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid #e5e7eb;
	}

	.view-reservations-button {
		width: 100%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		background-color: #2563eb;
		border: none;
		border-radius: 0.75rem;
		color: white;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.view-reservations-button:hover {
		background-color: #1d4ed8;
		transform: translateY(-1px);
	}

	.view-reservations-button:active {
		transform: translateY(1px);
	}

	.section-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1a1a1a;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.form-wrapper {
		padding: 0;
		padding-right: 0;
	}

	.form-container {
		margin-top: 1rem;
		padding: 0;
	}

	.form-group {
		margin-bottom: 1.5rem;
		padding: 0;
		padding-right: 1.6rem;
	}

	.form-group label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: #4b5563;
		margin-bottom: 0.5rem;
	}

	.form-group input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #e5e7eb;
		border-radius: 0.75rem;
		background-color: #f9fafb;
		font-size: 1rem;
		transition: all 0.2s ease;
	}

	.form-group input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.button-group {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 2rem;
		padding: 0;
	}

	.action-button {
		width: 100%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		background-color: #f3f4f6;
		border: 1px solid #e5e7eb;
		border-radius: 0.75rem;
		color: #374151;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.action-button:hover {
		background-color: #e5e7eb;
	}

	.secondary-button,
	.primary-button {
		padding: 0.75rem 1.25rem;
		border-radius: 0.75rem;
		font-size: 0.875rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.secondary-button {
		background-color: #f3f4f6;
		border: 1px solid #e5e7eb;
		color: #374151;
		flex: 1;
	}

	.secondary-button:hover {
		background-color: #e5e7eb;
	}

	.primary-button {
		background-color: #3b82f6;
		color: white;
		border: none;
		flex: 1;
	}

	.primary-button:hover {
		background-color: #2563eb;
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
	}

	.info-column {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.info-item {
		margin-bottom: 1rem;
		padding: 0.75rem;
		background-color: #f9fafb;
		border-radius: 0.5rem;
	}

	.info-label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: #6b7280;
		margin-bottom: 0.25rem;
	}

	.info-value {
		color: #1f2937;
		font-weight: 500;
	}

	.error-message {
		color: #dc2626;
		background-color: #fee2e2;
		border: 1px solid #fecaca;
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
	}

	.success-message {
		color: #059669;
		background-color: #d1fae5;
		border: 1px solid #a7f3d0;
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
	}

	.login-prompt {
		background: white;
		padding: 2rem;
		border-radius: 1rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		text-align: center;
	}

	.login-prompt p {
		margin-bottom: 1.5rem;
		color: #4b5563;
	}

	.mt-4 {
		margin-top: 1rem;
	}

	@media (max-width: 1024px) {
		.content-container {
			flex-direction: column;
		}

		.address-section {
			position: static;
			width: 100%;
		}

		.details-section {
			width: 100%;
		}

		.info-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 640px) {
		.account-title {
			font-size: 1.5rem;
		}

		.section-title {
			font-size: 1.25rem;
		}

		.button-group {
			flex-direction: column;
		}

		.back-button {
			position: static;
			margin-bottom: 1rem;
		}

		.secondary-button,
		.primary-button {
			width: 100%;
		}
	}
</style>
