<!-- src/routes/movies/+page.svelte -->
<script lang="ts">
	import Icon from '@iconify/svelte';
	import { fade } from 'svelte/transition';

	interface Movie {
		Title: string;
		Year: string;
		Genre: string;
		Director: string;
		Poster: string;
		Plot: string;
		imdbRating: string;
		id: string;
	}

	export let data: { movies: Movie[] };
	let searchQuery = '';
	let filteredMovies: Movie[] = [];

	function goBackHome() {
		window.location.href = 'http://localhost:5173/';
	}

	$: {
		if (searchQuery) {
			filteredMovies = data.movies.filter(
				(movie) =>
					movie.Title.toLowerCase().includes(searchQuery.toLowerCase()) ||
					movie.Genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
					movie.Director.toLowerCase().includes(searchQuery.toLowerCase())
			);
		} else {
			filteredMovies = data.movies;
		}
	}
</script>

<main>
	<div class="container">
		<button class="back-button" on:click={goBackHome}>
			<Icon icon="mdi:arrow-left" width="20" height="20" />
			Back to Home
		</button>

		<h1 class="page-title">Filme</h1>

		<!-- Search Section -->
		<div class="search-section">
			<div class="search-container">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search by title, genre or director..."
					class="search-input"
				/>
				{#if searchQuery}
					<button class="clear-search" on:click={() => (searchQuery = '')}>
						<Icon icon="mdi:close" width="20" height="20" />
					</button>
				{/if}
			</div>
		</div>

		<!-- Movies Grid -->
		<div class="movies-grid">
			{#each filteredMovies as movie (movie.id)}
				<a href={`/movies/${movie.id}`} class="movie-card" transition:fade>
					<div class="poster-container">
						<img
							src={movie.Poster !== 'N/A' ? movie.Poster : '/fallback-image.jpg'}
							alt={movie.Title}
							class="movie-poster"
						/>
						<div class="movie-rating">⭐ {movie.imdbRating}</div>
					</div>
					<div class="movie-info">
						<h2 class="movie-title">{movie.Title}</h2>
						<p class="movie-year">{movie.Year}</p>
						<p class="movie-genre">{movie.Genre}</p>
						<p class="movie-plot">{movie.Plot}</p>
					</div>
				</a>
			{:else}
				<div class="no-results">
					<Icon icon="mdi:movie-off" width="48" height="48" />
					<p>Keine Filme gefunden</p>
				</div>
			{/each}
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

	.search-section {
		margin-bottom: 2rem;
	}

	.search-container {
		max-width: 600px;
		margin: 0 auto;
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-input {
		width: 100%;
		padding: 0.75rem 1rem;
		font-size: 1rem;
		border: 2px solid #e5e7eb;
		border-radius: 0.75rem;
		background-color: white;
		transition: all 0.2s ease;
	}

	.search-input:focus {
		outline: none;
		border-color: #2563eb;
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
	}

	.clear-search {
		position: absolute;
		right: 1rem;
		background: none;
		border: none;
		color: #6b7280;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.clear-search:hover {
		background-color: #f3f4f6;
		color: #1f2937;
	}

	.movies-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
		padding: 1rem 0;
	}

	.movie-card {
		background: white;
		border-radius: 1rem;
		overflow: hidden;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		transition: all 0.3s ease;
		text-decoration: none;
		color: inherit;
		display: flex;
		flex-direction: column;
	}

	.movie-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 12px rgba(0, 0, 0, 0.1);
	}

	.poster-container {
		position: relative;
		aspect-ratio: 2/3;
		overflow: hidden;
	}

	.movie-poster {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s ease;
	}

	.movie-card:hover .movie-poster {
		transform: scale(1.05);
	}

	.movie-rating {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		background-color: rgba(0, 0, 0, 0.75);
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.movie-info {
		padding: 1rem;
		flex-grow: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.movie-title {
		font-size: 1rem;
		font-weight: 600;
		color: #1a1a1a;
		margin-bottom: 0.25rem;
	}

	.movie-year {
		color: #6b7280;
		font-size: 0.875rem;
	}

	.movie-genre {
		color: #2563eb;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.movie-plot {
		color: #4b5563;
		font-size: 0.875rem;
		line-height: 1.5;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
		margin-top: auto;
	}

	.no-results {
		grid-column: 1 / -1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 4rem 0;
		color: #6b7280;
	}

	@media (max-width: 640px) {
		.page-title {
			font-size: 1.5rem;
			margin-bottom: 1.5rem;
		}

		.search-container {
			max-width: 100%;
		}

		.movies-grid {
			grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
			gap: 0.75rem;
		}
	}
</style>
