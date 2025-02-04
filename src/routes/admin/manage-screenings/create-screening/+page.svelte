<script lang="ts">
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import '../../../../i18n.js';
	import { t } from 'svelte-i18n';

	export let data: { halls: { id: number; name: string }[] };

	let movieQuery: string = '';
	let searchResults: { movie_id: string; title: string }[] = [];
	let selectedMovie: { movie_id: string; title: string } | null = null;

	let hall_id: number | null = null;

	let start_time: string | null = null;

	let saveMessage: string | null = null;
	let searchError: string | null = null;

	// Filme suchen
	async function fetchMovies() {
		if (!movieQuery.trim()) {
			searchResults = [];
			searchError = null;
			return;
		}

		try {
			const response = await fetch(
				`/admin/manage-screenings/search-movies?query=${encodeURIComponent(movieQuery)}`
			);
			if (response.ok) {
				const result = await response.json();
				searchResults = result.movies;
				// If no movies are found, show a translation
				searchError =
					result.movies.length === 0
						? $t('admin_manageScreenings.createScreening.noMoviesFound')
						: null;
			} else {
				const error = await response.json();
				// Fallback if there's no message from the server
				searchError = error.message || $t('admin_manageScreenings.createScreening.searchError');
			}
		} catch (error) {
			console.error('Netzwerkfehler:', error);
			searchError = $t('admin_manageScreenings.createScreening.genericError');
		}
	}

	function selectMovie(movie: { movie_id: string; title: string }) {
		selectedMovie = movie;
		searchResults = [];
		movieQuery = '';
	}

	async function submitForm(event: Event) {
		event.preventDefault();
		saveMessage = null;

		if (!selectedMovie || !hall_id || !start_time) {
			saveMessage = $t('admin_manageScreenings.createScreening.fillAllFields');
			return;
		}

		// First, save the movie to the movies table
		try {
			const movieResponse = await fetch('/admin/manage-screenings/create-screening/save-movie', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					movie_id: selectedMovie.movie_id,
					title: selectedMovie.title
				})
			});

			if (!movieResponse.ok) {
				const error = await movieResponse.json();
				saveMessage = error.message || $t('admin_manageScreenings.createScreening.saveMovieError');
				return;
			}

			// Then proceed with creating the screening
			const formData = new FormData();
			formData.append('movie_id', selectedMovie.movie_id);
			formData.append('hall_id', String(hall_id));
			formData.append('start_time', start_time);

			const response = await fetch('/admin/manage-screenings/create-screening', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				const result = await response.json();
				// Fallback if there's no message from the server
				saveMessage =
					result.message || $t('admin_manageScreenings.createScreening.createScreeningSuccess');
				// Reset form
				selectedMovie = null;
				hall_id = null;
				start_time = null;
				movieQuery = '';
			} else {
				const error = await response.json();
				saveMessage =
					error.message || $t('admin_manageScreenings.createScreening.createScreeningError');
			}
		} catch (error) {
			console.error('Error:', error);
			saveMessage = $t('admin_manageScreenings.createScreening.unexpectedError');
		}
	}

	// Zurück navigieren
	function goBack() {
		goto('/admin/manage-screenings');
	}
</script>

<svelte:head>
	<title>{$t('admin_manageScreenings.createScreening.pageTitle')}</title>
</svelte:head>

<main>
	<div class="container">
		<div class="page-header">
			<button class="back-btn" on:click={goBack}>
				<Icon style="font-size: 1.25rem; margin-right: 0.5rem;" icon="ic:outline-arrow-back" />
				{$t('admin_manageScreenings.createScreening.backBtn')}
			</button>
			<h1 class="page-title">
				{$t('admin_manageScreenings.createScreening.heading')}
			</h1>
		</div>

		{#if saveMessage}
			<p class="feedback {saveMessage.toLowerCase().includes('error') ? 'error' : 'success'}">
				{saveMessage}
			</p>
		{/if}

		<form on:submit={submitForm} class="form">
			<div class="form-group">
				<label>
					{$t('admin_manageScreenings.createScreening.filmSearchLabel')}
					<input
						type="text"
						bind:value={movieQuery}
						placeholder={$t('admin_manageScreenings.createScreening.filmSearchPlaceholder')}
						on:input={fetchMovies}
					/>
				</label>

				{#if searchError}
					<p class="error">{searchError}</p>
				{/if}

				{#if searchResults.length > 0}
					<ul class="search-results">
						{#each searchResults as movie}
							<!-- svelte-ignore a11y-click-events-have-key-events -->
							<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
							<li on:click={() => selectMovie(movie)}>
								{movie.title}
							</li>
						{/each}
					</ul>
				{/if}

				{#if selectedMovie}
					<p>
						<strong>{$t('admin_manageScreenings.createScreening.selectedMovieLabel')}</strong>
						{selectedMovie.title}
					</p>
				{/if}
			</div>

			<div class="form-group">
				<label>
					{$t('admin_manageScreenings.createScreening.hallLabel')}
					<select name="hall_id" bind:value={hall_id}>
						<option value="" disabled selected>
							{$t('admin_manageScreenings.createScreening.hallLabel')}
						</option>
						{#each data.halls as hall}
							<option value={hall.id}>{hall.name}</option>
						{/each}
					</select>
				</label>
			</div>

			<div class="form-group">
				<label>
					{$t('admin_manageScreenings.createScreening.dateTimeLabel')}
					<input type="datetime-local" name="start_time" bind:value={start_time} />
				</label>
			</div>

			<button type="submit" class="submit-btn">
				<Icon style="font-size: 1.25rem; margin-right: 0.5rem;" icon="ic:outline-add" />
				{$t('admin_manageScreenings.createScreening.createScreeningBtn')}
			</button>
		</form>
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
		background-color: #ffffff;
		padding: 2rem;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

	.form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	label {
		font-weight: 500;
		color: #374151;
	}

	input,
	select {
		padding: 0.5rem;
		font-size: 1rem;
		border: 1px solid #d1d5db;
		border-radius: 0.25rem;
		width: 100%;
		transition: border-color 0.2s ease;
	}

	input:focus,
	select:focus {
		border-color: #6b7280;
		outline: none;
	}

	.search-results {
		list-style: none;
		padding: 0;
		margin: 0.5rem 0;
		border: 1px solid #d1d5db;
		border-radius: 0.25rem;
		max-height: 150px;
		overflow-y: auto;
		background-color: #fff;
	}

	.search-results li {
		padding: 0.5rem;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.search-results li:hover {
		background-color: #f3f4f6;
	}

	.error {
		color: #dc3545;
		font-size: 0.875rem;
	}

	.feedback {
		text-align: center;
		font-size: 1rem;
		margin-bottom: 1rem;
	}

	.feedback.error {
		color: #dc3545;
	}

	.feedback.success {
		color: #28a745;
	}

	.submit-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 1rem;
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

	.submit-btn:hover {
		background-color: #218838;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
</style>
