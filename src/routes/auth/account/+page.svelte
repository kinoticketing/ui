<script lang="ts">
	import Icon from '@iconify/svelte';
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { Loader } from '@googlemaps/js-api-loader';
	import { onMount } from 'svelte';

	export let data: PageData;

	let showChangePassword = false;
	let newPassword = '';
	let confirmPassword = '';
	let addressInput: HTMLInputElement;
	let address = {
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

	onMount(async () => {
		try {
			const response = await fetch('/api/maps');
			const { apiKey } = await response.json();

			const loader = new Loader({
				apiKey,
				version: 'weekly',
				libraries: ['places']
			});

			await loader.load();
			console.log('Google Maps loaded'); // Debug log

			const autocomplete = new google.maps.places.Autocomplete(addressInput, {
				fields: ['address_components', 'geometry', 'name'],
				types: ['address']
			});
			console.log('Autocomplete initialized'); // Debug log

			autocomplete.addListener('place_changed', () => {
				const place = autocomplete.getPlace();
				console.log('Selected place:', place); // Debug log
				if (place.address_components) {
					for (const component of place.address_components) {
						const type = component.types[0];
						if (type === 'street_number' || type === 'route') {
							address.street_address += component.long_name + ' ';
						} else if (type === 'locality') {
							address.city = component.long_name;
						} else if (type === 'administrative_area_level_1') {
							address.state = component.long_name;
						} else if (type === 'postal_code') {
							address.postal_code = component.long_name;
						} else if (type === 'country') {
							address.country = component.long_name;
						}
					}
				}
			});
		} catch (error) {
			console.error('Error loading Google Maps:', error);
		}
	});

	function handleChangePassword() {
		console.log('Password change attempted', { newPassword, confirmPassword });
		showChangePassword = false;
		newPassword = '';
		confirmPassword = '';
	}

	function handleAddPaymentMethod() {
		console.log('Add payment method attempted');
	}

	function handleRemovePaymentMethod(id: number) {
		console.log('Remove payment method attempted', { id });
		paymentMethods = paymentMethods.filter((method) => method.id !== id);
	}
</script>

<div class="account-container">
	<h2>Account Information</h2>

	{#if data.session}
		<div class="user-info">
			{#if data.session && data.session.user}
				<p><Icon icon="mdi:email" /> Email: {data.session.user.email}</p>
			{/if}
			<p>
				<Icon icon="mdi:account" /> Name: {data.session.user
					? data.session.user.name
					: 'Not provided'}
			</p>
		</div>

		<div class="section">
			<h3>Address Information</h3>
			<div class="input-group">
				<input
					bind:this={addressInput}
					type="text"
					placeholder="Search for your address"
					class="address-search"
				/>
			</div>

			<div class="address-fields">
				<div class="input-group">
					<input
						type="text"
						bind:value={address.street_address}
						placeholder="Street Address"
						readonly
					/>
				</div>
				<div class="input-group">
					<input type="text" bind:value={address.city} placeholder="City" readonly />
				</div>
				<div class="input-group">
					<input type="text" bind:value={address.state} placeholder="State" readonly />
				</div>
				<div class="input-group">
					<input type="text" bind:value={address.postal_code} placeholder="Postal Code" readonly />
				</div>
				<div class="input-group">
					<input type="text" bind:value={address.country} placeholder="Country" readonly />
				</div>
			</div>
		</div>

		<div class="section">
			<h3>Change Password</h3>
			{#if showChangePassword}
				<form on:submit|preventDefault={handleChangePassword}>
					<div class="input-group">
						<input type="password" bind:value={newPassword} placeholder="New Password" required />
					</div>
					<div class="input-group">
						<input
							type="password"
							bind:value={confirmPassword}
							placeholder="Confirm New Password"
							required
						/>
					</div>
					<button type="submit" class="btn primary">Change Password</button>
					<button type="button" class="btn secondary" on:click={() => (showChangePassword = false)}
						>Cancel</button
					>
				</form>
			{:else}
				<button class="btn primary" on:click={() => (showChangePassword = true)}>
					<Icon icon="mdi:key-change" />
					Change Password
				</button>
			{/if}
		</div>

		<div class="section">
			<h3>Payment Methods</h3>
			{#if paymentMethods.length > 0}
				<ul class="payment-methods">
					{#each paymentMethods as method}
						<li>
							<Icon
								icon={method.type.toLowerCase() === 'visa' ? 'logos:visa' : 'logos:mastercard'}
							/>
							{method.type} ending in {method.last4}
							<button class="btn danger" on:click={() => handleRemovePaymentMethod(method.id)}>
								<Icon icon="mdi:delete" />
								Remove
							</button>
						</li>
					{/each}
				</ul>
			{:else}
				<p>No payment methods added yet.</p>
			{/if}
			<button class="btn primary" on:click={handleAddPaymentMethod}>
				<Icon icon="mdi:credit-card-plus" />
				Add Payment Method
			</button>
		</div>
	{:else}
		<p>Please log in to view your account information.</p>
		<button type="button" class="login-btn" on:click={() => goto('/login')}>Login</button>
	{/if}
</div>

<style>
	.account-container {
		max-width: 400px;
		margin: 2rem auto;
		padding: 2rem;
		border: 1px solid #ddd;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		background-color: white;
	}

	h2,
	h3 {
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.address-search {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
		margin-bottom: 1rem;
	}

	.address-fields {
		display: grid;
		gap: 1rem;
	}

	.address-fields input {
		background-color: #f8f9fa;
	}

	.user-info p {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.section {
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px solid #ddd;
	}

	.input-group {
		margin-bottom: 1rem;
		position: relative;
	}

	input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.75rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		margin-bottom: 0.5rem;
	}

	.primary {
		background-color: #007bff;
		color: white;
	}

	.secondary {
		background-color: #6c757d;
		color: white;
	}

	.danger {
		background-color: #dc3545;
		color: white;
	}

	.payment-methods {
		list-style-type: none;
		padding: 0;
	}

	.payment-methods li {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 0.5rem;
		font-size: 0.9rem;
	}

	.payment-methods .btn {
		width: auto;
		padding: 0.5rem;
		font-size: 0.8rem;
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
