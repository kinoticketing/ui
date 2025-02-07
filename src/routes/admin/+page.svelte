<script>
	import Icon from '@iconify/svelte';
	import '../../i18n.js';
	import { t } from 'svelte-i18n';
</script>

<svelte:head>
	<title>{$t('admin.pageTitle')}</title>
</svelte:head>

<main>
	<div class="container">
		<h1 class="page-title">{$t('admin.welcomeTitle')}</h1>
		<p>{$t('admin.welcomeParagraph')}</p>

		<div class="btn-group">
			<button class="btn" on:click={() => (window.location.href = '/admin/manage-halls')}>
				<Icon style="font-size: 1.25rem; margin-right: 0.5rem;" icon="ic:outline-meeting-room" />
				{$t('admin.manageHalls')}
			</button>

			<button class="btn" on:click={() => (window.location.href = '/admin/manage-screenings')}>
				<Icon style="font-size: 1.25rem; margin-right: 0.5rem;" icon="ic:outline-movie-creation" />
				{$t('admin.manageScreenings')}
			</button>

			<button class="btn" on:click={() => (window.location.href = '/admin/manage-reservations')}>
				<Icon
					style="font-size: 1.25rem; margin-right: 0.5rem;"
					icon="ic:outline-confirmation-number"
				/>
				{$t('admin.manageReservations')}
			</button>
		</div>
	</div>
</main>

<style>
	p {
		font-size: 1.1rem;
		color: #555;
		line-height: 1.6;
		margin-bottom: 2.5rem;
		max-width: 600px;
		margin-left: auto;
		margin-right: auto;
		text-align: center;
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
	}

	main {
		min-height: 100vh;
		background-color: #f8f9fa;
		padding: 2rem 1rem;
	}

	.container {
		max-width: 800px;
		margin: 0 auto;
		text-align: center;
	}

	.page-title {
		font-size: 2rem;
		font-weight: 600;
		color: #1a1a1a;
		margin-bottom: 2rem;
	}

	.btn-group {
		display: flex;
		justify-content: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background-color: #3498db;
		color: white;
		border: none;
		padding: 0.75rem 1.25rem;
		border-radius: 0.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.btn:hover {
		background-color: #2980b9;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	@media (max-width: 640px) {
		.page-title {
			font-size: 1.5rem;
		}
	}
</style>
