<!-- src/routes/+page.svelte -->
<script lang="ts">
	import Icon from '@iconify/svelte';
	import '../i18n.js';
	import { t } from 'svelte-i18n';
	import { i18nReady } from '../i18n.js';
	import { onMount } from 'svelte';

	let loaded = false;
	onMount(async () => {
		await i18nReady;
		loaded = true;
	});

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
</script>

{#if loaded}
	<main>
		<div class="container">
			<!-- Hero Section -->
			<section class="hero">
				<img src="/banner.png" alt="Cinema Banner" />
				<div class="hero-content">
					<h1>{$t('home.hero.heading')}</h1>
					<p>{$t('home.hero.description')}</p>
					<a href="/movies" class="cta-button">
						{$t('home.hero.buttonText')}
						<Icon icon="mdi:arrow-right" width="20" height="20" />
					</a>
				</div>
			</section>

			<!-- Now Playing Section -->
			<section class="content-section">
				<div class="details-container">
					<div class="section-header">
						<h2>{$t('home.nowPlaying.heading')}</h2>
						<a href="/movies" class="view-all">
							{$t('home.nowPlaying.viewAll')}
							<Icon icon="mdi:arrow-right" width="16" height="16" />
						</a>
					</div>

					<div class="movie-grid">
						{#each data.movies.slice(0, 6) as movie}
							<a href="/movies/{movie.id}" class="movie-card">
								<div class="poster-container">
									<img
										src={movie.Poster !== 'N/A' ? movie.Poster : '/fallback-movie-poster.jpg'}
										alt={movie.Title}
										class="movie-poster"
									/>
									<div class="movie-rating">⭐ {movie.imdbRating}</div>
								</div>
								<div class="movie-info">
									<h3 class="movie-title">{movie.Title}</h3>
									<p class="movie-year">{movie.Year}</p>
									<p class="movie-genre">{movie.Genre}</p>
								</div>
							</a>
						{/each}
					</div>
				</div>
			</section>

			<!-- Features Section -->
			<section class="content-section">
				<div class="details-container">
					<h2 class="features-title">{$t('home.features.heading')}</h2>
					<div class="features-grid">
						<div class="feature-card">
							<Icon icon="mdi:theater" width="48" height="48" />
							<h3>{$t('home.features.modernTech.title')}</h3>
							<p>{$t('home.features.modernTech.description')}</p>
						</div>
						<div class="feature-card">
							<Icon icon="mdi:sofa" width="48" height="48" />
							<h3>{$t('home.features.premiumComfort.title')}</h3>
							<p>{$t('home.features.premiumComfort.description')}</p>
						</div>
						<div class="feature-card">
							<Icon icon="mdi:food" width="48" height="48" />
							<h3>{$t('home.features.snackBar.title')}</h3>
							<p>{$t('home.features.snackBar.description')}</p>
						</div>
						<div class="feature-card">
							<Icon icon="mdi:ticket-percent" width="48" height="48" />
							<h3>{$t('home.features.attractiveOffers.title')}</h3>
							<p>{$t('home.features.attractiveOffers.description')}</p>
						</div>
					</div>
				</div>
			</section>

			<!-- Coming Soon Section -->
			<section class="content-section">
				<div class="details-container">
					<div class="section-header">
						<h2>{$t('home.comingSoon.heading')}</h2>
						<a href="/movies" class="view-all">
							{$t('home.comingSoon.viewAll')}
							<Icon icon="mdi:arrow-right" width="16" height="16" />
						</a>
					</div>

					<div class="movie-grid">
						{#each data.movies.slice(6, 12) as movie}
							<a href="/movies/{movie.id}" class="movie-card">
								<div class="poster-container">
									<img
										src={movie.Poster !== 'N/A' ? movie.Poster : '/fallback-movie-poster.jpg'}
										alt={movie.Title}
										class="movie-poster"
									/>
									<div class="movie-rating">⭐ {movie.imdbRating}</div>
								</div>
								<div class="movie-info">
									<h3 class="movie-title">{movie.Title}</h3>
									<p class="movie-year">{movie.Year}</p>
									<p class="movie-genre">{movie.Genre}</p>
								</div>
							</a>
						{/each}
					</div>
				</div>
			</section>

			<!-- Newsletter Section -->
			<section class="newsletter-section">
				<div class="details-container">
					<div class="newsletter-content">
						<h2>{$t('home.newsletter.heading')}</h2>
						<p>{$t('home.newsletter.description')}</p>
						<form class="newsletter-form">
							<input type="email" placeholder={$t('home.newsletter.emailPlaceholder')} required />
							<button type="submit">{$t('home.newsletter.subscribeButton')}</button>
						</form>
					</div>
				</div>
			</section>
		</div>
	</main>
{/if}

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

	/* Hero Section */
	.hero {
		position: relative;
		height: 600px;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		color: white;
		margin-bottom: 2rem;
		overflow: hidden;
		border-radius: 1rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.hero img {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		z-index: 1;
	}

	.hero::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.7);
		z-index: 2;
	}

	.hero-content {
		max-width: 800px;
		padding: 0 1rem;
		position: relative;
		z-index: 3;
	}

	.hero h1 {
		font-size: 3rem;
		font-weight: 700;
		margin-bottom: 1rem;
	}

	.hero p {
		font-size: 1.25rem;
		margin-bottom: 2rem;
	}

	.cta-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 2rem;
		background-color: transparent;
		color: white;
		border: 2px solid white;
		border-radius: 0.5rem;
		font-weight: 500;
		transition: all 0.2s ease;
		text-decoration: none;
	}

	.cta-button:hover {
		background-color: rgba(255, 255, 255, 0.1);
		transform: translateY(-2px);
	}

	/* Content Sections */
	.content-section {
		margin-bottom: 2rem;
	}

	.details-container {
		background: white;
		padding: 2rem;
		border-radius: 1rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.section-header h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1a1a1a;
	}

	.view-all {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #1a1a1a;
		font-weight: 500;
		transition: color 0.2s;
		text-decoration: none;
	}

	.view-all:hover {
		color: #000000;
	}

	/* Movie Grid */
	.movie-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 2rem;
	}

	.movie-card {
		background: white;
		border-radius: 1rem;
		overflow: hidden;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
		text-decoration: none;
	}

	.movie-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
	}

	.poster-container {
		position: relative;
	}

	.movie-poster {
		width: 100%;
		aspect-ratio: 2/3;
		object-fit: cover;
	}

	.movie-rating {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background-color: rgba(0, 0, 0, 0.75);
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	.movie-info {
		padding: 1rem;
	}

	.movie-info h3 {
		font-size: 1.125rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: #1a1a1a;
	}

	.movie-year,
	.movie-genre {
		font-size: 0.875rem;
		color: #666;
		margin-bottom: 0.25rem;
	}

	/* Features Section */
	.features-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1a1a1a;
		text-align: center;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 2rem;
	}

	.feature-card {
		text-align: center;
		padding: 2rem;
	}

	.feature-card :global(svg) {
		color: #1a1a1a;
		margin-bottom: 1rem;
	}

	.feature-card h3 {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: #1a1a1a;
	}

	.feature-card p {
		color: #666;
		line-height: 1.5;
	}

	/* Newsletter Section */
	.newsletter-section {
		margin-bottom: 0;
	}

	.newsletter-content {
		max-width: 600px;
		margin: 0 auto;
		text-align: center;
	}

	.newsletter-content h2 {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 1rem;
		color: #1a1a1a;
	}

	.newsletter-content p {
		color: #666;
		margin-bottom: 2rem;
	}

	.newsletter-form {
		display: flex;
		gap: 1rem;
	}

	.newsletter-form input {
		flex: 1;
		padding: 0.75rem 1rem;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		font-size: 1rem;
	}

	.newsletter-form button {
		padding: 0.75rem 2rem;
		background-color: #1a1a1a;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.newsletter-form button:hover {
		background-color: #1d4ed8;
	}

	@media (max-width: 1024px) {
		.hero {
			height: 400px;
		}

		.hero h1 {
			font-size: 2rem;
		}

		.newsletter-form {
			flex-direction: column;
		}

		.newsletter-form button {
			width: 100%;
		}
	}

	@media (max-width: 640px) {
		.section-header {
			flex-direction: column;
			gap: 1rem;
			text-align: center;
		}

		.features-grid {
			grid-template-columns: 1fr;
		}

		.movie-grid {
			grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		}
	}
</style>
