<script lang="ts">
	import Icon from '@iconify/svelte';
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	// import { Loader } from '@googlemaps/js-api-loader';

	export let data: PageData;

	let showChangePassword = false;
	let currentPassword = '';
	let newPassword = '';
	let confirmPassword = '';
	let passwordError = '';
	let passwordSuccess = '';
	let loadingPassword = false;
	let showEditAddress = false;
	// let addressInput: HTMLInputElement;

	let address = $page.data.session?.user?.address || {
		street_address: '',
		city: '',
		state: '',
		postal_code: '',
		country: ''
	};

	let paymentMethods = [
		{ id: 1, type: 'Visa', last4: '4242' },
		{ id: 2, type: 'Mastercard', last4: '5555' }
	];

	// Google Maps functionality commented out
	/*
	onMount(async () => {
		// ... Google Maps code commented out ...
	});
	*/
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
			// Refresh the page data to show updated address
			await goto($page.url.pathname, { replaceState: true });
		} catch (error) {
			console.error('Error updating address:', error);
		}
	}


	function handleRemovePaymentMethod(id: number) {
		paymentMethods = paymentMethods.filter((method) => method.id !== id);
	}
</script>

<div class="account-container">
	<h2>Account Information</h2>

	{#if $page.data.session}
		<div class="user-info">
			{#if data.session && data.session.user}
				<p><Icon icon="mdi:email" /> Email: {data.session.user.email}</p>
			{/if}
			<p>
				<Icon icon="mdi:account" /> Name: {data.session.user
					? data.session.user.name
					: 'Not provided'}
			</p>
			{#if address}
				<p>
					<Icon icon="mdi:map-marker" /> Address: {address.street_address},
					{address.postal_code}
					{address.city},
					{address.state}, {address.country}
				</p>
			{/if}
		</div>

		<div class="section">
			<h3>Password</h3>
			{#if !$page.data.session?.user?.hasPassword}
				{#if !showChangePassword}
					<button class="btn primary" on:click={() => (showChangePassword = true)}>
						<Icon icon="mdi:key-plus" />
						Create Password
					</button>
				{:else}
					<form class="password-form" on:submit|preventDefault={handlePasswordSubmit}>
						<div class="form-group">
							<label for="new-password">New Password</label>
							<input type="password" id="new-password" bind:value={newPassword} required />
						</div>
						<div class="form-group">
							<label for="confirm-password">Confirm Password</label>
							<input type="password" id="confirm-password" bind:value={confirmPassword} required />
						</div>
						{#if passwordError}
							<p class="error-message">{passwordError}</p>
						{/if}
						{#if passwordSuccess}
							<p class="success-message">{passwordSuccess}</p>
						{/if}
						<div class="button-group">
							<button
								type="button"
								class="btn secondary"
								on:click={() => (showChangePassword = false)}
							>
								Cancel
							</button>
							<button type="submit" class="btn primary" disabled={loadingPassword}>
								{#if loadingPassword}
									Loading...
								{:else}
									Create Password
								{/if}
							</button>
						</div>
					</form>
				{/if}
			{:else if !showChangePassword}
				<button class="btn primary" on:click={() => (showChangePassword = true)}>
					<Icon icon="mdi:key-change" />
					Change Password
				</button>
			{:else}
				<form class="password-form" on:submit|preventDefault={handlePasswordSubmit}>
					<div class="form-group">
						<label for="current-password">Current Password</label>
						<input type="password" id="current-password" bind:value={currentPassword} required />
					</div>
					<div class="form-group">
						<label for="new-password">New Password</label>
						<input type="password" id="new-password" bind:value={newPassword} required />
					</div>
					<div class="form-group">
						<label for="confirm-password">Confirm New Password</label>
						<input type="password" id="confirm-password" bind:value={confirmPassword} required />
					</div>
					{#if passwordError}
						<p class="error-message">{passwordError}</p>
					{/if}
					{#if passwordSuccess}
						<p class="success-message">{passwordSuccess}</p>
					{/if}
					<div class="button-group">
						<button
							type="button"
							class="btn secondary"
							on:click={() => (showChangePassword = false)}
						>
							Cancel
						</button>
						<button type="submit" class="btn primary" disabled={loadingPassword}>
							{#if loadingPassword}
								Loading...
							{:else}
								Update Password
							{/if}
						</button>
					</div>
				</form>
			{/if}
		</div>

		<div class="section">
			<h3>Address Information</h3>
			{#if !showEditAddress && $page.data.session?.user?.address}
				<div class="address-display">
					<p>{$page.data.session.user.address.street_address}</p>
					<p>
						{$page.data.session.user.address.city}, {$page.data.session.user.address.state}
						{$page.data.session.user.address.postal_code}
					</p>
					<p>{$page.data.session.user.address.country}</p>
					<button class="btn primary" on:click={() => (showEditAddress = true)}>
						<Icon icon="mdi:pencil" />
						Edit Address
					</button>
				</div>
			{:else}
				<form on:submit|preventDefault={handleUpdateAddress}>
					<div class="address-fields">
						<div class="input-group">
							<input type="text" bind:value={address.street_address} placeholder="Street Address" />
						</div>
						<div class="input-group">
							<input type="text" bind:value={address.city} placeholder="City" />
						</div>
						<div class="input-group">
							<input type="text" bind:value={address.state} placeholder="State" />
						</div>
						<div class="input-group">
							<input type="text" bind:value={address.postal_code} placeholder="Postal Code" />
						</div>
						<div class="input-group">
							<input type="text" bind:value={address.country} placeholder="Country" />
						</div>
					</div>
					<div class="button-group">
						<button type="button" class="btn secondary" on:click={() => (showEditAddress = false)}>
							Cancel
						</button>
						<button type="submit" class="btn primary">Update Address</button>
					</div>
				</form>
			{/if}
		</div>
	{:else}
		<p>Please log in to view your account information.</p>
		<button type="button" class="login-btn" on:click={() => goto('/login')}>Login</button>
	{/if}
</div>

<style>
	.account-container {
		max-width: 800px;
		margin: 2rem auto;
		padding: 2rem;
		border: 1px solid #ddd;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		background-color: white;
	}

	h2,
	h3 {
		margin-bottom: 1.5rem;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.user-info p {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.section {
		margin-top: 2rem;
		padding: 1.5rem;
		border-top: 1px solid #ddd;
		background: white;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.password-form {
		max-width: 400px;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
	}

	.form-group input {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
	}

	.button-group {
		display: flex;
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 500;
	}

	.btn.primary {
		background-color: #007bff;
		color: white;
		width: 100%;
	}

	.btn.secondary {
		background-color: #6c757d;
		color: white;
		width: 100%;
	}

	.btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.error-message {
		color: #dc3545;
		margin-top: 0.5rem;
	}

	.success-message {
		color: #28a745;
		margin-top: 0.5rem;
	}

	.address-display {
		line-height: 1.5;
		margin-bottom: 1rem;
	}

	.address-display p {
		margin: 0.25rem 0;
	}

	.address-fields {
		display: grid;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.input-group {
		display: flex;
		align-items: center;
	}

	.input-group input {
		flex: 1;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
		background-color: #f8f9fa;
	}

	.login-btn {
		width: 100%;
		padding: 0.75rem;
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		margin-top: 1rem;
	}
</style>
