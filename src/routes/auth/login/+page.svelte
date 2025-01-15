<script lang="ts">
	import { signIn, signOut } from '@auth/sveltekit/client';
	import Icon from '@iconify/svelte';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import toast from 'svelte-french-toast';
	import { onMount } from 'svelte';

	let email = '';
	let password = '';
	let showPassword = false;

	// Handle Github login with callbackUrl
	function handleGithubLogin() {
		signIn('github', {
			callbackUrl: '/auth/account'
		});
	}

	function handleLogin() {
		console.log('Login attempted', { email, password });
	}

	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}

	// Show toast on successful login
	onMount(() => {
		if (browser && $page.data.session?.user) {
			toast.success('Successfully logged in!', {
				icon: '✅', // Using an emoji instead of Icon component
				duration: 3000,
				style: 'border-radius: 10px; background: #333; color: #fff;'
			});
		}
	});
</script>

<div class="login-container">
	{#if !$page.data.session?.user}
		<h2>Login to Cinema System</h2>

		<div class="auth-providers">
			<button on:click={handleGithubLogin} class="provider-btn github">
				<Icon icon="mdi:github" width="24" height="24" />
				Log in with GitHub
			</button>
		</div>

		<div class="spacer">
			<span>or</span>
		</div>

		<form on:submit|preventDefault={handleLogin}>
			<div class="input-group user-group">
				<input type="text" bind:value={email} placeholder="Email or Username" required />
			</div>

			<div class="input-group password-group">
				<input type={showPassword ? 'text' : 'password'} placeholder="Password" required />
				<button type="button" class="toggle-password" on:click={togglePasswordVisibility}>
					<Icon icon={showPassword ? 'mdi:eye-off' : 'mdi:eye'} width="20" height="20" />
				</button>
			</div>

			<button type="submit" class="login-btn">Login</button>
		</form>

		<p class="forgot-password">
			<a href="/auth/forgot-password">Forgot password?</a>
		</p>
		<p class="create-account">
			<a href="/auth/register">Don't have an account? Create Account</a>
		</p>
	{/if}
</div>

<style>
	.login-container {
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

	.github {
		background-color: #24292e;
		color: white;
	}

	.input-group {
		margin-bottom: 1rem;
		position: relative;
	}

	.user-group {
		display: flex;
		align-items: center;
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

	.forgot-password {
		text-align: center;
		margin-top: 1rem;
		font-size: 0.9rem;
	}

	.forgot-password a {
		color: #007bff;
		text-decoration: none;
	}

	.forgot-password a:hover {
		text-decoration: underline;
	}

	.create-account {
		text-align: center;
		margin-top: 1rem;
		font-size: 0.9rem;
	}

	.create-account a {
		color: #007bff;
		text-decoration: none;
	}

	.create-account a:hover {
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
</style>
