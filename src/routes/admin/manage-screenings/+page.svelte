<script lang="ts">
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';

	export let data: {
		showtimes: {
			showtime_id: number;
			movie_id: string; // Changed from movie_title to match our schema
			hall_name: string;
			showtime: string;
			end_time: string;
			total_seats: number;
			reserved_seats: number;
			occupancy_percentage: number;
		}[];
	};

	// Navigation to detail page
	function goToDetail(showtime_id: number) {
		goto(`/admin/manage-screenings/${showtime_id}`);
	}

	// Delete screening
	async function deleteShowtime(showtime_id: number) {
		if (confirm('Sind Sie sicher, dass Sie diese Vorstellung löschen möchten?')) {
			const response = await fetch(`/admin/manage-screenings/${showtime_id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				location.reload();
			} else {
				alert('Fehler beim Löschen der Vorstellung.');
			}
		}
	}

	function goToCreateScreening() {
		goto('/admin/manage-screenings/create-screening');
	}

	// Format date for display
	function formatDateTime(dateString: string) {
		return new Date(dateString).toLocaleString();
	}

	// Zurück navigieren
	function goBack() {
		goto('/admin');
	}
</script>

<svelte:head>
	<title>Vorstellungen verwalten</title>
</svelte:head>

<main>
	<div class="container">
		<div class="page-header">
			<button class="back-btn" on:click={goBack}>
				<Icon style="font-size: 1.25rem; margin-right: 0.5rem;" icon="ic:outline-arrow-back" />
				Zurück
			</button>
			<h1 class="page-title">Alle Vorstellungen</h1>
		</div>

		{#if data.showtimes.length > 0}
			<ul class="showtime-list">
				{#each data.showtimes as showtime}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
					<li class="showtime-item" on:click={() => goToDetail(showtime.showtime_id)}>
						<p><strong>Film ID:</strong> {showtime.movie_id}</p>
						<p><strong>Saal:</strong> {showtime.hall_name}</p>
						<p><strong>Startzeit:</strong> {formatDateTime(showtime.showtime)}</p>
						<p><strong>Endzeit:</strong> {formatDateTime(showtime.end_time)}</p>
						<p>
							<strong>Auslastung:</strong>
							{showtime.reserved_seats}/{showtime.total_seats}
							({showtime.occupancy_percentage}%)
						</p>
						<button
							class="delete-btn"
							on:click|stopPropagation={() => deleteShowtime(showtime.showtime_id)}
						>
							<Icon style="font-size: 1.25rem; margin-right: 0.5rem;" icon="ic:outline-delete" />
							Vorstellung löschen
						</button>
					</li>
				{/each}
			</ul>
		{:else}
			<p>Keine Vorstellungen vorhanden.</p>
		{/if}

		<button class="create-showtime-btn" on:click={goToCreateScreening}>
			<Icon style="font-size: 1.25rem; margin-right: 0.5rem;" icon="ic:outline-add" />
			Neue Vorstellung erstellen
		</button>
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
	}

	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 2rem;
	}

	.page-title {
		font-size: 2rem;
		font-weight: 600;
		color: #1a1a1a;
		margin: 0;
		text-align: center;
		width: 100%;
	}

	.back-btn {
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

	.back-btn:hover {
		background-color: #f3f4f6;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.showtime-list {
		list-style-type: none;
		padding: 0;
		margin: 0;
	}

	.showtime-item {
		background-color: white;
		padding: 1.25rem;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 1rem;
		cursor: pointer;
		transition: box-shadow 0.2s;
	}

	.showtime-item:hover {
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.delete-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background-color: #dc3545;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 0.25rem;
		cursor: pointer;
		font-weight: 500;
		transition: background-color 0.2s;
		margin-top: 1rem;
	}

	.delete-btn:hover {
		background-color: #c82333;
	}

	.create-showtime-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 2rem auto 0;
		padding: 0.75rem 1.25rem;
		background-color: #28a745;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.create-showtime-btn:hover {
		background-color: #218838;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
</style>
