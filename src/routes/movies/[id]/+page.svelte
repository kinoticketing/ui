<!-- src/routes/movies/[id]/+page.svelte -->
<script lang="ts">
	import Icon from '@iconify/svelte';

	interface Showtime {
		id: number;
		time: string;
		endTime: string;
		hall: number;
		hallName: string;
	}

	interface MovieData {
		movie: {
			Title: string;
			Year: string;
			Genre: string;
			Director: string;
			Actors: string;
			Plot: string;
			Poster: string;
			imdbRating: string;
			imdbID: string;
			Runtime: string;
			id: string;
		};
		showtimes: Showtime[];
	}

	export let data: MovieData;

	function goBackToMovies() {
		window.location.href = '/movies';
	}

	import { onMount } from 'svelte';
	let trailerId: string | null = null;
	let trailerError: string | null = null;

	onMount(async () => {
		try {
			const response = await fetch(`/api/movies/${data.movie.imdbID}/trailer`);
			if (!response.ok) {
				throw new Error('Failed to fetch trailer');
			}
			const trailerData = await response.json();
			trailerId = trailerData.trailerId;
		} catch (e) {
			console.error('Error loading trailer:', e);
			trailerError = 'Trailer konnte nicht geladen werden';
		}
	});
</script>

<main>
	<div class="container">
		<button class="back-button" on:click={goBackToMovies}>
			<Icon icon="mdi:arrow-left" width="20" height="20" />
			Back to Movies
		</button>

		<h1 class="movie-title">{data.movie.Title}</h1>

		<div class="content-container">
			<!-- Left side - Movie Details -->
			<div class="details-section">
				<div class="details-container">
					<img
						src={data.movie.Poster !== 'N/A' ? data.movie.Poster : '/fallback-image.jpg'}
						alt={data.movie.Title}
						class="poster"
					/>
					<div class="movie-info">
						<div class="info-item">
							<span class="info-label">Jahr:</span>
							<span class="info-value">{data.movie.Year}</span>
						</div>
						<div class="info-item">
							<span class="info-label">Genre:</span>
							<span class="info-value">{data.movie.Genre}</span>
						</div>
						<div class="info-item">
							<span class="info-label">Regisseur:</span>
							<span class="info-value">{data.movie.Director}</span>
						</div>
						<div class="info-item">
							<span class="info-label">Darsteller:</span>
							<span class="info-value">{data.movie.Actors}</span>
						</div>
						<div class="info-item plot">
							<span class="info-label">Handlung:</span>
							<span class="info-value">{data.movie.Plot}</span>
						</div>
						<div class="info-item">
							<span class="info-label">IMDb-Bewertung:</span>
							<span class="info-value">⭐ {data.movie.imdbRating}</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Right side - Showtimes and Trailer -->
			<div class="right-section">
				<!-- Showtimes -->
				<div class="showtimes-container">
					<h2 class="showtimes-title">Vorstellungen</h2>

					<div class="showtimes-list">
						{#if data.showtimes.length === 0}
							<p class="no-showtimes">Keine Vorstellungen vorhanden.</p>
						{:else}
							{#each data.showtimes as showtime}
								<a class="showtime-card" href={`/movies/${data.movie.id}/${showtime.id}`}>
									<div class="showtime-info">
										<div class="showtime-datetime">
											{new Date(showtime.time).toLocaleString('de-DE', {
												weekday: 'short',
												year: 'numeric',
												month: 'short',
												day: 'numeric',
												hour: '2-digit',
												minute: '2-digit'
											})} Uhr
										</div>
										<div class="showtime-details">
											<span class="hall-info">Saal: {showtime.hallName}</span>
											<span class="duration-info">Dauer: {data.movie.Runtime}</span>
										</div>
									</div>
								</a>
							{/each}
						{/if}
					</div>
				</div>

				<!-- Trailer Section -->
				<div class="trailer-container">
					<h2 class="trailer-title">Filmtrailer</h2>
					<div class="trailer-wrapper">
						{#if trailerError}
							<div class="trailer-error">
								{trailerError}
							</div>
						{:else if trailerId}
							<iframe
								src={`https://www.youtube.com/embed/${trailerId}?autoplay=1&mute=1`}
								title="Filmtrailer"
								class="trailer-iframe"
								allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
								allowfullscreen
							></iframe>
						{:else}
							<div class="trailer-loading">Trailer wird geladen...</div>
						{/if}
					</div>
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

	.movie-title {
		font-size: 2rem;
		font-weight: 600;
		color: #1a1a1a;
		margin-bottom: 2rem;
		text-align: center;
	}

	.content-container {
		display: flex;
		gap: 2rem;
		align-items: flex-start;
	}

	.details-section {
		flex: 3;
	}

	.details-container {
		background: white;
		padding: 2rem;
		border-radius: 1rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		display: flex;
		gap: 2rem;
	}

	.poster {
		width: 350px;
		height: auto;
		border-radius: 0.75rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		flex-shrink: 0;
	}

	.movie-info {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.info-label {
		font-weight: 600;
		color: #4b5563;
	}

	.info-value {
		color: #1f2937;
		line-height: 1.5;
	}

	.plot {
		margin-top: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid #e5e7eb;
	}

	.right-section {
		flex: 2;
		display: flex;
		flex-direction: column;
		gap: 2rem;
		position: sticky;
		top: 2rem;
	}

	.showtimes-container,
	.trailer-container {
		background: white;
		padding: 1.5rem;
		border-radius: 1rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.showtimes-title,
	.trailer-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.showtimes-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.no-showtimes {
		text-align: center;
		color: #6b7280;
		padding: 2rem 0;
	}

	.showtime-card {
		display: block;
		padding: 1rem;
		background-color: #f8f9fa;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.showtime-card:hover {
		background-color: #f3f4f6;
		transform: translateY(-2px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.showtime-info {
		color: #1f2937;
	}

	.showtime-datetime {
		font-size: 1.125rem;
		font-weight: 500;
		margin-bottom: 0.5rem;
	}

	.showtime-details {
		display: flex;
		justify-content: space-between;
		color: #6b7280;
		font-size: 0.875rem;
	}

	.trailer-wrapper {
		position: relative;
		width: 100%;
		padding-top: 56.25%; /* 16:9 Aspect Ratio */
	}

	.trailer-iframe {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border: none;
		border-radius: 0.5rem;
	}

	.trailer-error,
	.trailer-loading {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #f8f9fa;
		border-radius: 0.5rem;
		color: #6b7280;
		text-align: center;
		padding: 1rem;
	}

	.trailer-error {
		color: #ef4444;
	}

	@media (max-width: 1024px) {
		.content-container {
			flex-direction: column;
		}

		.right-section {
			position: static;
			width: 100%;
		}

		.details-section {
			width: 100%;
		}

		.details-container {
			flex-direction: column;
			align-items: center;
		}

		.poster {
			max-width: 100%;
			width: 350px;
			margin-bottom: 2rem;
		}

		.movie-info {
			width: 100%;
		}
	}

	@media (max-width: 640px) {
		.movie-title {
			font-size: 1.5rem;
		}

		.showtime-details {
			flex-direction: column;
			gap: 0.25rem;
		}
	}
</style>
