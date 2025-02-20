<script lang="ts">
	import { signIn } from '@auth/sveltekit/client';
	import Icon from '@iconify/svelte';
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import { onMount } from 'svelte';
	import '../../../i18n.js';
	import { t } from 'svelte-i18n';
	import { i18nReady } from '../../../i18n.js';

	let loaded = false;
	onMount(async () => {
		await i18nReady;
		loaded = true;
	});

	export let form: ActionData;

	let username = '';
	let email = '';
	let password = '';
	let confirmPassword = '';
	let showPassword = false;
	let showConfirmPassword = false;
	let isLoading = false;

	function togglePasswordVisibility(field: 'password' | 'confirmPassword') {
		if (field === 'password') {
			showPassword = !showPassword;
		} else {
			showConfirmPassword = !showConfirmPassword;
		}
	}
	function validateForm() {
		if (password !== confirmPassword) {
			return 'Passwords do not match';
		}
		return null;
	}
	async function handleSubmit() {
		const error = validateForm();
		if (error) {
			return;
		}
		isLoading = true;
		return async ({ result, update }: { result: any; update: any }) => {
			if (result.type === 'success') {
				window.location.href = '/auth/login';
			}
			await update();
			isLoading = false;
		};
	}
	function handleFormComplete() {
		isLoading = false;
	}
</script>

{#if loaded}
	<main>
		<div class="create-account-container">
			<h2>{$t('register.title')}</h2>

			<div class="auth-providers">
				<button on:click={() => signIn('github')} class="provider-btn github">
					<Icon icon="mdi:github" />
					{$t('register.signUpWithGithub')}
				</button>
			</div>

			<div class="spacer">
				<span>{$t('register.or')}</span>
			</div>

			<form
				method="POST"
				use:enhance={() => {
					return handleSubmit();
				}}
				on:submit={() => {
					const error = validateForm();
					if (error) {
						form = { message: error, username: undefined, email: undefined };
						return false;
					}
				}}
			>
				<div class="input-group">
					<input
						name="username"
						type="text"
						bind:value={username}
						placeholder={$t('register.usernamePlaceholder')}
						required
					/>
				</div>

				<div class="input-group">
					<input
						name="email"
						type="email"
						bind:value={email}
						placeholder={$t('register.emailPlaceholder')}
						required
					/>
				</div>

				<div class="input-group password-group">
					<input
						name="password"
						type={showPassword ? 'text' : 'password'}
						placeholder={$t('register.passwordPlaceholder')}
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
						name="confirmPassword"
						type={showConfirmPassword ? 'text' : 'password'}
						placeholder={$t('register.confirmPasswordPlaceholder')}
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

				<button type="submit" class="create-btn">
					{$t('register.createAccountButton')}
				</button>
			</form>

			<p class="login-link">
				<a href="/auth/login">{$t('register.alreadyHaveAccount')}</a>
			</p>
		</div>
	</main>
{/if}

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
