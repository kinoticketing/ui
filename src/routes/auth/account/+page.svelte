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
			// const response = await fetch('/api/maps');
			// const apiKey = 'AIzaSyBV_ZaVSN28DS3PrimZaumzLxDpCfQyODo';

			// const loader = new Loader({
			// 	apiKey,
			// 	version: 'weekly',
			// 	libraries: ['places']
			// });

			// await loader.load();

			// Create the autocomplete object
			const options = {
				componentRestrictions: { country: 'de' }, // Restrict to Germany
				fields: ['formatted_address', 'address_components']
			};

			const autocomplete = new window.google.maps.places.Autocomplete(addressInput, options);

			// Re-enable input fields
			// Cast NodeList elements to HTMLInputElement
			const addressFields = document.querySelectorAll(
				'.address-fields input'
			) as NodeListOf<HTMLInputElement>;
			addressFields.forEach((field) => {
				field.disabled = false;
			});

			autocomplete.addListener('place_changed', () => {
				const place = autocomplete.getPlace();
				if (!place.address_components) return;

				// Reset values
				address = {
					street_address: '',
					city: '',
					state: '',
					postal_code: '',
					country: ''
				};

				// Parse address components
				place.address_components.forEach((component) => {
					const type = component.types[0];
					switch (type) {
						case 'street_number':
						case 'route':
							address.street_address += component.long_name + ' ';
							break;
						case 'locality':
							address.city = component.long_name;
							break;
						case 'administrative_area_level_1':
							address.state = component.long_name;
							break;
						case 'postal_code':
							address.postal_code = component.long_name;
							break;
						case 'country':
							address.country = component.long_name;
							break;
					}
				});
			});
		} catch (error) {
			console.error('Error:', error);
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
			<div class="input-group address-search-group">
				<input
					bind:this={addressInput}
					type="text"
					placeholder="Search for your address"
					class="address-search"
					id="address-input"
					autocomplete="off"
				/>
			</div>

			<div class="address-fields">
				<div class="input-group">
					<input
						type="text"
						bind:value={address.street_address}
						placeholder="Street Address"
						disabled
					/>
				</div>
				<div class="input-group">
					<input type="text" bind:value={address.city} placeholder="City" disabled />
				</div>
				<div class="input-group">
					<input type="text" bind:value={address.state} placeholder="State" disabled />
				</div>
				<div class="input-group">
					<input type="text" bind:value={address.postal_code} placeholder="Postal Code" disabled />
				</div>
				<div class="input-group">
					<input type="text" bind:value={address.country} placeholder="Country" disabled />
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
						<li class="payment-method">
							<div>
								<Icon
									icon={method.type.toLowerCase() === 'visa' ? 'logos:visa' : 'logos:mastercard'}
								/>
								{method.type} ending in {method.last4}
							</div>
							<button
								class="btn danger remove-button"
								on:click={() => handleRemovePaymentMethod(method.id)}
							>
								<Icon icon="mdi:delete" />
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

	.address-search-group {
		/* Target the specific input-group for address search */
		display: flex;
		align-items: center;
	}

	.address-search {
		flex: 1; /* Allow the search input to grow and fill available space */
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

	.address-fields .input-group {
		/* Specifically target input-groups within address-fields */
		display: flex; /* Make the input-group a flex container */
		align-items: center; /* Vertically align the input field */
	}

	.address-fields input {
		flex: 1; /* Allow the input to grow and fill available space */
		background-color: #f8f9fa;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
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

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		margin-bottom: 0.5rem;
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

	.btn.danger {
		background-color: #dc3545;
		color: white;
	}

	.payment-methods {
		list-style-type: none;
		padding: 0;
	}

	.payment-method {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.5rem;
		font-size: 0.9rem;
	}

	.payment-methods .btn {
		width: auto;
		padding: 0.5rem;
		font-size: 0.8rem;
	}

	.remove-button {
		margin-left: auto; /* Push the button to the right */
	}

	.remove-button :global(svg) {
		/* Target the icon inside the button */
		width: 1.2em;
		height: 1.2em;
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
