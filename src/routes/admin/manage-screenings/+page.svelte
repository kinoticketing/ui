<script lang="ts">
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import '../../../i18n.js';
	import { t } from 'svelte-i18n';

	export let data: {
		showtimes: {
			showtime_id: number;
			movie_id: string;
			movie_title: string; // Neue Eigenschaft für den Filmtitel
			movie_poster_url: string; // Neue Eigenschaft für die Poster-URL
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
		if (confirm($t('admin_manageScreenings.deleteConfirmation'))) {
			const response = await fetch(`/admin/manage-screenings/${showtime_id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				location.reload();
			} else {
				alert($t('admin_manageScreenings.deleteError'));
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
	<title>{$t('admin_manageScreenings.pageTitle')}</title>
</svelte:head>

<main>
	<div class="container">
		<div class="page-header">
			<button class="back-btn" on:click={goBack}>
				<Icon style="font-size: 1.25rem; margin-right: 0.5rem;" icon="ic:outline-arrow-back" />
				{$t('admin_manageScreenings.backBtn')}
			</button>
			<h1 class="page-title">{$t('admin_manageScreenings.allScreenings')}</h1>
		</div>

		{#if data.showtimes.length > 0}
			<div class="showtime-grid">
				{#each data.showtimes as showtime}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<div class="showtime-tile" on:click={() => goToDetail(showtime.showtime_id)}>
						<div class="tile-header">
							<h3>{showtime.hall_name}</h3>
							<button
								class="delete-btn"
								on:click|stopPropagation={() => deleteShowtime(showtime.showtime_id)}
							>
								<Icon style="font-size: 1rem;" icon="ic:outline-delete" />
							</button>
						</div>
						<div class="tile-content">
							<div class="movie-info">
								<div>
									<p>
										<strong>{$t('admin_manageScreenings.film')}</strong>
										{showtime.movie_title}
									</p>
									<p>
										<strong>{$t('admin_manageScreenings.startTime')}</strong>
										{formatDateTime(showtime.showtime)}
									</p>
									<p>
										<strong>{$t('admin_manageScreenings.endTime')}</strong>
										{formatDateTime(showtime.end_time)}
									</p>
									<p>
										<strong>{$t('admin_manageScreenings.occupancy')}</strong>
										{showtime.reserved_seats}/{showtime.total_seats}
										({showtime.occupancy_percentage}%)
									</p>
								</div>
								{#if showtime.movie_poster_url}
									<img
										src={showtime.movie_poster_url}
										alt={$t('admin_manageScreenings.moviePosterAlt')}
										class="movie-poster"
									/>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<p>{$t('admin_manageScreenings.noScreenings')}</p>
		{/if}

		<button class="create-showtime-btn" on:click={goToCreateScreening}>
			<Icon style="font-size: 1.25rem; margin-right: 0.5rem;" icon="ic:outline-add" />
			{$t('admin_manageScreenings.createShowtimeBtn')}
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
		max-width: 1200px;
		margin: 0 auto;
	}

	.page-header {
		position: relative;
		margin-bottom: 2rem;
	}

	.page-title {
		font-size: 2rem;
		font-weight: 600;
		color: #1a1a1a;
		margin: 0;
		text-align: center;
	}

	.back-btn {
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%);
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

	.showtime-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.showtime-tile {
		background-color: white;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		cursor: pointer;
		transition: box-shadow 0.2s;
	}

	.showtime-tile:hover {
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.tile-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.tile-header h3 {
		margin: 0;
		font-size: 1.25rem;
	}

	.delete-btn {
		background-color: transparent;
		border: none;
		cursor: pointer;
		color: #dc3545;
		transition: color 0.2s;
	}

	.delete-btn:hover {
		color: #c82333;
	}

	.tile-content {
		padding: 1rem;
	}

	.movie-info {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.movie-poster {
		max-width: 100px;
		height: auto;
		border-radius: 0.25rem;
	}

	.create-showtime-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 2rem auto 0;
		padding: 0.75rem 1.25rem;
		background-color: transparent;
		color: #28a745;
		border: 2px solid #28a745;
		border-radius: 0.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.create-showtime-btn:hover {
		background-color: #218838;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		color: white;
	}
</style>
