<script lang="ts">
	import { signIn } from '@auth/sveltekit/client';
	import Icon from '@iconify/svelte';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import toast from 'svelte-french-toast';

	import { onMount } from 'svelte';
	import '../../../i18n.js';
	import { t } from 'svelte-i18n';
	import { i18nReady } from '../../../i18n.js';

	let loaded = false;
	onMount(async () => {
		await i18nReady;
		loaded = true;
	});

	let email = '';
	let password = '';
	let showPassword = false;
	let isLoading = false;

	function handleGithubLogin() {
		signIn('github', {
			callbackUrl: '/auth/login-success'
		});
	}

	async function handleLogin(event: Event) {
		event.preventDefault();
		isLoading = true;

		try {
			const result = await signIn('credentials', {
				email,
				password,
				redirect: false
			});

			if (result && 'error' in result) {
				toast.error('Invalid email or password');
			} else if (result?.ok) {
				window.location.href = '/auth/login-success';
			}
		} catch (error) {
			console.error('Login error:', error);
			toast.error('An error occurred during login');
		} finally {
			isLoading = false;
		}
	}

	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}

	onMount(() => {
		if (browser && $page.data.session?.user) {
			toast.success($t('login.loginSuccess'));
		}
	});

	function goBackToHome() {
		window.location.href = '/';
	}
</script>

{#if loaded}
	<main>
		<div class="container">
			<button class="back-button" on:click={goBackToHome}>
				<Icon icon="mdi:arrow-left" width="20" height="20" />
				{$t('login.backToHome')}
			</button>

			{#if !$page.data.session?.user}
				<h1 class="page-title">{$t('login.loginTitle')}</h1>

				<div class="content-container">
					<div class="login-section">
						<div class="login-container">
							<div class="auth-providers">
								<button on:click={handleGithubLogin} class="provider-btn">
									<Icon icon="mdi:github" width="24" height="24" />
									{$t('login.loginWithGithub')}
								</button>
							</div>

							<div class="divider">
								<span>{$t('login.orContinueWithEmail')}</span>
							</div>

							<form on:submit={handleLogin}>
								<div class="input-group">
									<input
										name="email"
										type="email"
										bind:value={email}
										placeholder="Email"
										required
									/>
								</div>

								<div class="input-group password-container">
									<input
										name="password"
										type="password"
										bind:value={password}
										placeholder="Password"
										required
										class="password-input"
									/>
									<button type="button" class="toggle-password" on:click={togglePasswordVisibility}>
										<Icon icon={showPassword ? 'mdi:eye-off' : 'mdi:eye'} width="20" height="20" />
									</button>
								</div>

								<button type="submit" class="submit-button" disabled={isLoading}>
									{isLoading ? 'Logging in...' : 'Login'}
								</button>
							</form>

							<div class="links-container">
								<a href="/auth/forgot-password" class="text-link">
									{$t('login.forgotPassword')}
								</a>
								<a href="/auth/register" class="text-link">
									{$t('login.createAccount')}
								</a>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</main>
{/if}

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

	/* .error-message {
		background-color: #fee2e2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 0.75rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
		text-align: center;
		font-size: 0.875rem;
	} */

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
		margin-bottom: 1rem;
	}

	.password-container {
		position: relative;
	}

	input {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		font-size: 1rem;
		transition: border-color 0.2s;
		box-sizing: border-box;
		max-width: 100%;
		min-width: 0;
	}

	input:focus {
		outline: none;
		border-color: #2563eb;
		box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
	}

	.password-input {
		padding-right: 2.5rem;
		width: 100%;
		box-sizing: border-box;
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

	.submit-button:disabled {
		background-color: #93c5fd;
		cursor: not-allowed;
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
