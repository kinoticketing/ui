<script lang="ts">
	import { goto } from '$app/navigation';

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
		if (confirm('Are you sure you want to delete this screening?')) {
			const response = await fetch(`/admin/manage-screenings/${showtime_id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				location.reload();
			} else {
				alert('Error deleting the screening.');
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
</script>

<main>
	<h1>All Screenings</h1>

	{#if data.showtimes.length > 0}
		<ul class="showtime-list">
			{#each data.showtimes as showtime}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
				<li class="showtime-item" on:click={() => goToDetail(showtime.showtime_id)}>
					<p><strong>Movie ID:</strong> {showtime.movie_id}</p>
					<p><strong>Hall:</strong> {showtime.hall_name}</p>
					<p><strong>Start Time:</strong> {formatDateTime(showtime.showtime)}</p>
					<p><strong>End Time:</strong> {formatDateTime(showtime.end_time)}</p>
					<p>
						<strong>Occupancy:</strong>
						{showtime.reserved_seats}/{showtime.total_seats}
						({showtime.occupancy_percentage}%)
					</p>
					<button
						class="delete-btn"
						on:click|stopPropagation={() => deleteShowtime(showtime.showtime_id)}
					>
						Delete Screening
					</button>
				</li>
			{/each}
		</ul>
	{:else}
		<p>No screenings available.</p>
	{/if}

	<button class="create-showtime-btn" on:click={goToCreateScreening}> Create New Screening </button>
</main>

<style>
	h1 {
		text-align: center;
		margin-bottom: 20px;
	}

	.showtime-list {
		list-style-type: none;
		padding: 0;
		max-width: 800px;
		margin: 0 auto 20px;
	}

	.showtime-item {
		background-color: #f9f9f9;
		padding: 15px;
		margin-bottom: 10px;
		border: 1px solid #ddd;
		border-radius: 5px;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.showtime-item:hover {
		background-color: #e9ecef;
	}

	.delete-btn {
		background-color: #dc3545;
		color: white;
		border: none;
		padding: 5px 10px;
		border-radius: 3px;
		cursor: pointer;
		font-size: 14px;
		margin-top: 10px;
	}

	.delete-btn:hover {
		background-color: #c82333;
	}

	.create-showtime-btn {
		display: block;
		margin: 20px auto;
		padding: 10px 20px;
		font-size: 16px;
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 5px;
		cursor: pointer;
	}

	.create-showtime-btn:hover {
		background-color: #0056b3;
	}
</style>
