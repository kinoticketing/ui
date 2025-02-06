<script lang="ts">
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import { fade, slide } from 'svelte/transition';

	export let data: { halls: { id: number; name: string }[] };

	let movieQuery: string = '';
	let searchResults: { movie_id: string; title: string }[] = [];
	let selectedMovie: { movie_id: string; title: string } | null = null;

	let hall_id: number | null = null;

	let start_time: string | null = null;

	let saveMessage: string | null = null;
	let searchError: string | null = null;

	let currentStep = 1;

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
				searchError = result.movies.length === 0 ? 'Keine Filme gefunden.' : null;
			} else {
				const error = await response.json();
				searchError = error.message || 'Fehler bei der Filmsuche.';
			}
		} catch (error) {
			console.error('Netzwerkfehler:', error);
			searchError = 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
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
			saveMessage = 'Bitte füllen Sie alle Felder aus.';
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
				saveMessage = error.message || 'Fehler beim Speichern des Films.';
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
				saveMessage = result.message || 'Vorstellung erfolgreich erstellt!';
				// Reset form
				selectedMovie = null;
				hall_id = null;
				start_time = null;
				movieQuery = '';
			} else {
				const error = await response.json();
				saveMessage = error.message || 'Fehler beim Erstellen der Vorstellung.';
			}
		} catch (error) {
			console.error('Fehler:', error);
			saveMessage = 'Ein unerwarteter Fehler ist aufgetreten.';
		}
	}

	// Zurück navigieren
	function goBack() {
		goto('/admin/manage-screenings');
	}
</script>

<svelte:head>
	<title>Neue Vorstellung erstellen</title>
</svelte:head>

<main>
	<div class="container">
		<div class="header">
			<h1 class="page-title">Create New Screening</h1>
			<div class="steps">
				<div class={`step ${currentStep >= 1 ? 'active' : ''}`}>
					<span class="step-number">1</span>
					<span class="step-text">Select Movie</span>
				</div>
				<div class={`step ${currentStep >= 2 ? 'active' : ''}`}>
					<span class="step-number">2</span>
					<span class="step-text">Choose Hall</span>
				</div>
				<div class={`step ${currentStep >= 3 ? 'active' : ''}`}>
					<span class="step-number">3</span>
					<span class="step-text">Set Time</span>
				</div>
			</div>
		</div>

		<div class="content">
			{#if currentStep === 1}
				<div class="search-section" transition:fade>
					<div class="search-box">
						<Icon icon="mdi:movie-search" width="24" />
						<input
							type="text"
							bind:value={movieQuery}
							placeholder="Search for movies..."
							on:input={fetchMovies}
						/>
					</div>

					{#if searchResults.length > 0}
						<div class="results" transition:slide>
							{#each searchResults as result}
								<!-- svelte-ignore a11y-click-events-have-key-events -->
								<!-- svelte-ignore a11y-no-static-element-interactions -->
								<div
									class="movie-card"
									class:selected={selectedMovie?.movie_id === result.movie_id}
									on:click={() => {
										selectedMovie = result;
										currentStep = 2;
									}}
								>
									<h3>{result.title}</h3>
									<Icon icon="mdi:chevron-right" width="24" />
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{:else if currentStep === 2}
				<div class="hall-section" transition:fade>
					<div class="halls-grid">
						{#each data.halls as hall}
							<!-- svelte-ignore a11y-click-events-have-key-events -->
							<!-- svelte-ignore a11y-no-static-element-interactions -->
							<div
								class="hall-card"
								class:selected={hall_id === hall.id}
								on:click={() => {
									hall_id = hall.id;
									currentStep = 3;
								}}
							>
								<Icon icon="mdi:theater" width="32" />
								<h3>{hall.name}</h3>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<div class="time-section" transition:fade>
					<input
						type="datetime-local"
						bind:value={start_time}
						class="time-picker"
					/>
					<button class="submit-btn" on:click={submitForm}>
						Create Screening
					</button>
				</div>
			{/if}
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
		padding: 2rem;
	}

	.header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.page-title {
		font-size: 2.5rem;
		color: #2c3e50;
		margin-bottom: 2rem;
	}

	.steps {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin-bottom: 3rem;
	}

	.step {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		opacity: 0.5;
		transition: opacity 0.3s;
	}

	.step.active {
		opacity: 1;
	}

	.step-number {
		background: #e0e0e0;
		width: 30px;
		height: 30px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
	}

	.step.active .step-number {
		background: #2563eb;
		color: white;
	}

	.search-box {
		display: flex;
		align-items: center;
		gap: 1rem;
		background: white;
		padding: 1rem;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
	}

	input {
		width: 100%;
		padding: 0.5rem;
		border: none;
		font-size: 1.1rem;
		outline: none;
	}

	.movie-card, .hall-card {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		margin: 1rem 0;
		cursor: pointer;
		transition: all 0.3s;
		display: flex;
		justify-content: space-between;
		align-items: center;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
	}

	.movie-card:hover, .hall-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0,0,0,0.1);
	}

	.selected {
		border: 2px solid #3498db;
		background: #f7fbfe;
	}

	.halls-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1.5rem;
	}

	.time-picker {
		width: 100%;
		padding: 1rem;
		font-size: 1.1rem;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		margin-bottom: 1.5rem;
	}

	.submit-btn {
		width: 100%;
		padding: 1rem;
		background: #2563eb;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1.1rem;
		cursor: pointer;
		transition: background 0.3s;
	}

	.submit-btn:hover {
		background: #1d4ed8;
	}
</style>
