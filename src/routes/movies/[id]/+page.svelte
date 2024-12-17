<script lang="ts">
	export let data: { movie: any; showtimes: { time: string; hall: string }[] };
</script>

<main>
	<h1 class="text-3xl font-bold mb-4">{data.movie.Title}</h1>
	<div class="super-div">
		<div class="flex flex-col lg:flex-row gap-4">
			<img
				src={data.movie.Poster !== 'N/A' ? data.movie.Poster : '/fallback-image.jpg'}
				alt={data.movie.Title}
				class="w-full lg:w-1/3 h-auto rounded-md shadow-md"
			/>
			<div class="flex-1">
				<p><strong>Year:</strong> {data.movie.Year}</p>
				<p><strong>Genre:</strong> {data.movie.Genre}</p>
				<p><strong>Director:</strong> {data.movie.Director}</p>
				<p><strong>Actors:</strong> {data.movie.Actors}</p>
				<p><strong>Plot:</strong> {data.movie.Plot}</p>
				<p><strong>IMDb Rating:</strong> {data.movie.imdbRating}</p>
			</div>
		</div>

		<!-- Vorstellungen anzeigen -->
		<h2 class="mt-6 text-2xl font-semibold">Vorstellungen</h2>
		<ul>
			{#each data.showtimes as showtime}
				<li>
					<strong>Zeit:</strong> {showtime.time} | <strong>Saal:</strong> {showtime.hall}
				</li>
			{/each}
		</ul>
	</div>
</main>

<style>
	main {
		padding: 2rem;
	}
	.super-div {
		display: flex;
		flex-direction: row;
	}
</style>
