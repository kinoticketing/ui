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

	function handleGithubLogin() {
		signIn('github', {
			callbackUrl: '/auth/login-success'
		});
	}

	function handleLogin() {
		console.log('Login attempted', { email, password });
	}

	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}

	onMount(() => {
		if (browser && $page.data.session?.user) {
			toast.success('Successfully logged in!', {
				icon: '✅',
				duration: 3000,
				style: 'border-radius: 10px; background: #333; color: #fff;'
			});
		}
	});

	function goBackToHome() {
		window.location.href = '/';
	}
</script>

<main>
	<div class="container">
		<button class="back-button" on:click={goBackToHome}>
			<Icon icon="mdi:arrow-left" width="20" height="20" />
			Back to Home
		</button>

		{#if !$page.data.session?.user}
			<h1 class="page-title">Login to Cinema System</h1>

			<div class="content-container">
				<div class="login-section">
					<div class="login-container">
						<div class="auth-providers">
							<button on:click={handleGithubLogin} class="provider-btn">
								<Icon icon="mdi:github" width="24" height="24" />
								Log in with GitHub
							</button>
						</div>

						<div class="divider">
							<span>or continue with email</span>
						</div>

						<form on:submit|preventDefault={handleLogin}>
							<div class="input-group">
								<input type="text" bind:value={email} placeholder="Email or Username" required />
							</div>

							<div class="input-group">
								<input type={showPassword ? 'text' : 'password'} placeholder="Password" required />
								<button type="button" class="toggle-password" on:click={togglePasswordVisibility}>
									<Icon icon={showPassword ? 'mdi:eye-off' : 'mdi:eye'} width="20" height="20" />
								</button>
							</div>

							<button type="submit" class="submit-button"> Login </button>
						</form>

						<div class="links-container">
							<a href="/auth/forgot-password" class="text-link"> Forgot password? </a>
							<a href="/auth/register" class="text-link"> Don't have an account? Create one </a>
						</div>
					</div>
				</div>
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

	.page-title {
		font-size: 2rem;
		font-weight: 600;
		color: #1a1a1a;
		margin-bottom: 2rem;
		text-align: center;
	}

	.content-container {
		display: flex;
		justify-content: center;
		padding-top: 2rem;
	}

	.login-section {
		width: 100%;
		max-width: 480px;
	}

	.login-container {
		background: white;
		padding: 2rem;
		border-radius: 1rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.auth-providers {
		margin-bottom: 1.5rem;
	}

	.provider-btn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background-color: #24292e;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.provider-btn:hover {
		background-color: #1a1e23;
	}

	.divider {
		display: flex;
		align-items: center;
		text-align: center;
		margin: 1.5rem 0;
	}

	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		border-bottom: 1px solid #e5e7eb;
	}

	.divider span {
		padding: 0 1rem;
		color: #6b7280;
		font-size: 0.875rem;
	}

	.input-group {
		position: relative;
		margin-bottom: 1rem;
	}

	input {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		font-size: 1rem;
		transition: border-color 0.2s;
	}

	input:focus {
		outline: none;
		border-color: #2563eb;
	}

	.toggle-password {
		position: absolute;
		right: 1rem;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		color: #6b7280;
		cursor: pointer;
	}

	.submit-button {
		width: 100%;
		padding: 0.75rem;
		background-color: #2563eb;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		margin-top: 1rem;
	}

	.submit-button:hover {
		background-color: #1d4ed8;
	}

	.links-container {
		margin-top: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		align-items: center;
	}

	.text-link {
		color: #2563eb;
		text-decoration: none;
		font-size: 0.875rem;
		transition: color 0.2s;
	}

	.text-link:hover {
		color: #1d4ed8;
		text-decoration: underline;
	}

	@media (max-width: 640px) {
		.page-title {
			font-size: 1.5rem;
			margin-bottom: 1.5rem;
		}

		.login-container {
			padding: 1.5rem;
		}

		.back-button {
			position: static;
			margin-bottom: 1.5rem;
		}
	}
</style>
