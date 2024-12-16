<script lang="ts">
	import { signIn } from '@auth/sveltekit/client';
	import Icon from '@iconify/svelte';
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	export let form: ActionData;

	let username = '';
	let email = '';
	let password = '';
	let confirmPassword = '';
	let showPassword = false;
	let showConfirmPassword = false;

	function togglePasswordVisibility(field: 'password' | 'confirmPassword') {
		if (field === 'password') {
			showPassword = !showPassword;
		} else {
			showConfirmPassword = !showConfirmPassword;
		}
	}
</script>

<div class="create-account-container">
	<h2>Create Your Cinema Account</h2>

	<div class="auth-providers">
		<button on:click={() => signIn('google')} class="provider-btn google">
			<Icon icon="logos:google-icon" />
			Sign up with Google
		</button>

		<button on:click={() => signIn('github')} class="provider-btn github">
			<Icon icon="mdi:github" />
			Sign up with GitHub
		</button>
	</div>

	<div class="spacer">
		<span>or</span>
	</div>

	<form method="POST" use:enhance>
		<div class="input-group">
			<input name="username" type="text" bind:value={username} placeholder="Username" required />
		</div>

		<div class="input-group">
			<input name="email" type="email" bind:value={email} placeholder="Email" required />
		</div>

		<div class="input-group password-group">
			<input
				name="password"
				type={showPassword ? 'text' : 'password'}
				placeholder="Password"
				required
			/>
			<button
				type="button"
				class="toggle-password"
				on:click={() => togglePasswordVisibility('password')}
			>
				<Icon icon={showPassword ? 'mdi:eye-off' : 'mdi:eye'} />
			</button>
		</div>

		<div class="input-group password-group">
			<input
				type={showConfirmPassword ? 'text' : 'password'}
				placeholder="Confirm Password"
				required
			/>
			<button
				type="button"
				class="toggle-password"
				on:click={() => togglePasswordVisibility('confirmPassword')}
			>
				<Icon icon={showConfirmPassword ? 'mdi:eye-off' : 'mdi:eye'} />
			</button>
		</div>

		{#if form?.message}
			<p class="error">{form.message}</p>
		{/if}

		<button type="submit" class="create-btn">Create Account</button>
	</form>

	<p class="login-link">
		<a href="/auth/login">Already have an account? Log In</a>
	</p>
</div>

<style>
	.create-account-container {
		max-width: 400px;
		margin: 2rem auto;
		padding: 2rem;
		border: 1px solid #ddd;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		background-color: white;
	}

	h2 {
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.auth-providers {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.provider-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 0.75rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.google {
		background-color: #4285f4;
		color: white;
	}

	.github {
		background-color: #24292e;
		color: white;
	}

	.input-group {
		margin-bottom: 1rem;
		position: relative;
	}

	.password-group {
		display: flex;
		align-items: center;
	}

	input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
		box-sizing: border-box; /* Add this line */
	}

	.toggle-password {
		position: absolute;
		right: 10px;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		cursor: pointer;
		color: #777;
	}

	.create-btn {
		width: 100%;
		padding: 0.75rem;
		background-color: #28a745;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		margin-top: 1rem;
	}

	.login-link {
		text-align: center;
		margin-top: 1rem;
		font-size: 0.9rem;
	}

	.login-link a {
		color: #007bff;
		text-decoration: none;
	}

	.login-link a:hover {
		text-decoration: underline;
	}

	.spacer {
		display: flex;
		align-items: center;
		text-align: center;
		margin: 20px 0;
	}

	.spacer::before,
	.spacer::after {
		content: '';
		flex: 1;
		border-bottom: 1px solid #ddd;
	}

	.spacer span {
		padding: 0 10px;
		color: #777;
		font-size: 0.9rem;
	}

	.error {
		color: red;
		text-align: center;
		margin-top: 1rem;
	}
</style>
