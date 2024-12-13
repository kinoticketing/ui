<script lang="ts">
	export let data: {
		showtimes: {
			showtime_id: number;
			showtime: string;
			movie_title: string; // IMDB-ID wird als Titel verwendet
			hall_name: string;
		}[];
	};

	function goToCreateScreening() {
		window.location.href = '/admin/manage-screenings/create-screening';
	}
</script>

<main>
	<h1>Alle Vorstellungen</h1>

	{#if data.showtimes.length > 0}
		<ul class="showtime-list">
			{#each data.showtimes as showtime}
				<li class="showtime-item">
					<p><strong>Film (IMDB-ID):</strong> {showtime.movie_title}</p>
					<p><strong>Saal:</strong> {showtime.hall_name}</p>
					<p><strong>Datum und Uhrzeit:</strong> {new Date(showtime.showtime).toLocaleString()}</p>
				</li>
			{/each}
		</ul>
	{:else}
		<p>Es sind keine Vorstellungen vorhanden.</p>
	{/if}

	<button class="create-showtime-btn" on:click={goToCreateScreening}>
		Neue Vorstellung erstellen
	</button>
</main>

<style>
	h1 {
		text-align: center;
		margin-bottom: 20px;
	}

	.showtime-list {
		list-style-type: none;
		padding: 0;
		max-width: 600px;
		margin: 0 auto 20px;
	}

	.showtime-item {
		background-color: #f9f9f9;
		padding: 15px;
		margin-bottom: 10px;
		border: 1px solid #ddd;
		border-radius: 5px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.showtime-item p {
		margin: 5px 0;
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
		transition: background 0.3s ease;
	}

	.create-showtime-btn:hover {
		background-color: #0056b3;
	}
</style>
