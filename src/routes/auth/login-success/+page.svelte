<script lang="ts">
	import { signOut } from '@auth/sveltekit/client';
	import Icon from '@iconify/svelte';
	import { page } from '$app/stores';

	function handleLogout() {
		signOut({ callbackUrl: '/auth/login' });
	}

	function navigateTo(path: string) {
		window.location.href = path;
	}
</script>

<main>
	<div class="container">
		<h1 class="welcome-title">Welcome, {$page.data.session?.user?.name || 'User'}!</h1>
		<p class="success-message">You've successfully logged in. Where would you like to go?</p>

		<div class="content-container">
			<div class="options-section">
				<div class="options-container">
					<div class="navigation-buttons">
						<button class="nav-button home" on:click={() => navigateTo('/')}>
							<Icon icon="mdi:home" width="24" height="24" />
							<div class="button-content">
								<span class="button-title">Home Page</span>
								<span class="button-description">Browse movies and showtimes</span>
							</div>
							<Icon icon="mdi:chevron-right" width="24" height="24" />
						</button>

						<button class="nav-button reservations" on:click={() => navigateTo('/reservations')}>
							<Icon icon="mdi:ticket" width="24" height="24" />
							<div class="button-content">
								<span class="button-title">My Reservations</span>
								<span class="button-description">View your booking history</span>
							</div>
							<Icon icon="mdi:chevron-right" width="24" height="24" />
						</button>

						<button class="nav-button account" on:click={() => navigateTo('/auth/account')}>
							<Icon icon="mdi:account" width="24" height="24" />
							<div class="button-content">
								<span class="button-title">Account Settings</span>
								<span class="button-description">Manage your profile and preferences</span>
							</div>
							<Icon icon="mdi:chevron-right" width="24" height="24" />
						</button>
					</div>

					<button class="logout-button" on:click={handleLogout}>
						<Icon icon="mdi:logout" width="20" height="20" />
						Logout
					</button>
				</div>
			</div>
		</div>
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

	.welcome-title {
		font-size: 2rem;
		font-weight: 600;
		color: #1a1a1a;
		margin-bottom: 0.5rem;
		text-align: center;
	}

	.success-message {
		text-align: center;
		color: #666;
		margin-bottom: 2rem;
	}

	.content-container {
		display: flex;
		justify-content: center;
		padding-top: 1rem;
	}

	.options-section {
		width: 100%;
		max-width: 640px;
	}

	.options-container {
		background: white;
		padding: 2rem;
		border-radius: 1rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.navigation-buttons {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.nav-button {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.25rem;
		background-color: #f8f9fa;
		border: 1px solid #e5e7eb;
		border-radius: 0.75rem;
		color: #374151;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.nav-button:hover {
		background-color: #f3f4f6;
		transform: translateY(-2px);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.button-content {
		flex: 1;
		text-align: left;
	}

	.button-title {
		display: block;
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
	}

	.button-description {
		display: block;
		font-size: 0.875rem;
		color: #6b7280;
		margin-top: 0.25rem;
	}

	.logout-button {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem;
		background-color: #ef4444;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.logout-button:hover {
		background-color: #dc2626;
	}

	@media (max-width: 640px) {
		.welcome-title {
			font-size: 1.5rem;
		}

		.options-container {
			padding: 1.5rem;
		}

		.nav-button {
			padding: 1rem;
		}

		.button-title {
			font-size: 1rem;
		}

		.button-description {
			font-size: 0.75rem;
		}
	}
</style>
