<script>
	import Icon from '@iconify/svelte';
	let adminName = 'Admin';
</script>

<svelte:head>
	<title>Admin Dashboard</title>
</svelte:head>

<main>
	<div class="container">
		<h1 class="page-title">Willkommen, {adminName}!</h1>
		<div class="btn-group">
			<button class="btn" on:click={() => (window.location.href = '/admin/manage-halls')}>
				<Icon style="font-size: 1.25rem; margin-right: 0.5rem;" icon="ic:outline-meeting-room" />
				Säle verwalten
			</button>
			<button class="btn" on:click={() => (window.location.href = '/admin/manage-screenings')}>
				<Icon style="font-size: 1.25rem; margin-right: 0.5rem;" icon="ic:outline-movie-creation" />
				Vorstellungen verwalten
			</button>
			<button class="btn" on:click={() => (window.location.href = '/admin/manage-reservations')}>
				<Icon
					style="font-size: 1.25rem; margin-right: 0.5rem;"
					icon="ic:outline-confirmation-number"
				/>
				Reservierungen verwalten
			</button>
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
