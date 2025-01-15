<!-- src/routes/movies/+page.svelte -->
<script lang="ts">
	import Icon from '@iconify/svelte';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import '../../i18n.js';
	import { t } from 'svelte-i18n';
	import { i18nReady } from '../../i18n.js';

	interface Movie {
		id: string;
		Title: string;
		Year: string;
		Genre: string;
		Director: string;
		Poster: string;
		Plot: string;
		imdbRating: string;
		nextScreening?: string;
	}

	let loaded = false;
	onMount(async () => {
		await i18nReady;
		loaded = true;
	});

	export let data: { movies: Movie[]; query: string };
	let searchQuery = data.query || '';
	let filteredMovies = data.movies;

	function goBackHome() {
		window.location.href = '/';
	}

	function handleSearch() {
		if (searchQuery) {
			goto(`?query=${encodeURIComponent(searchQuery)}`);
		} else {
			goto('?query=');
		}
	}

	function clearSearch() {
		searchQuery = '';
		goto('?query=');
	}

	function formatDate(dateString: string | undefined) {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleString('de-DE', {
			weekday: 'short',
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Initialize search query from URL
	$: {
		const urlQuery = $page.url.searchParams.get('query');
		if (urlQuery !== null && urlQuery !== searchQuery) {
			searchQuery = urlQuery;
		}
	}
</script>

{#if loaded}
	<main>
		<div class="container">
			<button class="back-button" on:click={goBackHome}>
				<Icon icon="mdi:arrow-left" width="20" height="20" />
				<!-- Use the moviesPage.backToHome string -->
				{$t('movies.backToHome')}
			</button>

			<h1 class="page-title">
				<!-- Use the moviesPage.pageTitle string -->
				{$t('movies.pageTitle')}
			</h1>

			<!-- Search Section -->
			<div class="search-section">
				<div class="search-container">
					<input
						type="text"
						bind:value={searchQuery}
						placeholder={$t('movies.searchPlaceholder')}
						class="search-input"
						on:keydown={(e) => e.key === 'Enter' && handleSearch()}
					/>
					<button class="search-button" on:click={handleSearch}>
						<Icon icon="mdi:magnify" width="20" height="20" />
					</button>
					{#if searchQuery}
						<button class="clear-search" on:click={clearSearch}>
							<Icon icon="mdi:close" width="20" height="20" />
						</button>
					{/if}
				</div>
			</div>

			<!-- Movies Grid -->
			<div class="movies-grid">
				{#each data.movies as movie (movie.id)}
					<a href={`/movies/${movie.id}`} class="movie-card" transition:fade>
						<div class="poster-container">
							<img src={movie.Poster} alt={movie.Title} class="movie-poster" />
							<div class="movie-rating">⭐ {movie.imdbRating}</div>
						</div>
						<div class="movie-info">
							<h2 class="movie-title">{movie.Title}</h2>
							<p class="movie-year">{movie.Year}</p>
							<p class="movie-genre">{movie.Genre}</p>
							<p class="movie-plot">{movie.Plot}</p>
							{#if movie.nextScreening}
								<p class="next-screening">
									<!-- Use the moviesPage.nextScreeningLabel string -->
									{$t('movies.nextScreeningLabel')}
									{formatDate(movie.nextScreening)}
								</p>
							{/if}
						</div>
					</a>
				{:else}
					<div class="no-results">
						<Icon icon="mdi:movie-off" width="48" height="48" />
						<!-- Use the moviesPage.noResults string -->
						<p>{$t('movies.noResults')}</p>
					</div>
				{/each}
			</div>
		</div>
	</main>
{/if}

<style>
	/* All the styles remain exactly the same */
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
		border-color: #1a1a1a;
		box-shadow: 0 0 0 3px rgba(26, 26, 26, 0.1);
	}

	.search-button {
		position: absolute;
		right: 2.5rem;
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

	.search-button:hover {
		color: #1a1a1a;
		background-color: #f3f4f6;
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
		color: #1a1a1a;
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

	.next-screening {
		font-size: 0.875rem;
		color: #1a1a1a;
		font-weight: 500;
		margin-top: 0.5rem;
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
