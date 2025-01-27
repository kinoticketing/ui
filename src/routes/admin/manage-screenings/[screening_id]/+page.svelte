<script lang="ts">
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';

	export let data;
	let { screening, halls } = data;
	let seatPlan = screening?.seat_plan ?? [];
	let isEditMode = false;

	// Add seatTypes definition
	const seatTypes = {
		vip: { modifier: 5.0, class: 'vip' },
		premium: { modifier: 3.0, class: 'premium' },
		regular: { modifier: 1.0, class: 'regular' },
		disabled: { modifier: 0.8, class: 'disabled' },
		booked: { modifier: 0.0, class: 'booked' } // Add booked status
	};

	// Movie search state
	let movieQuery = '';
	let searchResults: { movie_id: string; title: string }[] = [];
	let selectedMovie: { movie_id: string; title: string } | null = null;
	let searchError: string | null = null;

	let editForm = {
		movie_id: screening?.movie_id || '',
		start_time: screening?.start_time
			? new Date(screening.start_time).toISOString().slice(0, 16)
			: '',
		hall_id: screening?.hall_id || ''
	};

	// Movie search function
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
		editForm.movie_id = movie.movie_id;
		searchResults = [];
		movieQuery = '';
	}

	async function handleEdit() {
		try {
			// First save the movie if it's a new selection
			if (selectedMovie) {
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
					alert(error.message || 'Fehler beim Speichern des Films.');
					return;
				}
			}

			// Then update the screening
			const response = await fetch('', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(editForm)
			});

			const result = await response.json();

			if (result.success) {
				isEditMode = false;
				screening = {
					...screening,
					...result.screening,
					movie_title: selectedMovie?.title || screening.movie_title,
					hall_name: halls.find(h => h.id === result.screening.hall_id)?.name
				};
				selectedMovie = null;
			} else {
				alert('Fehler beim Aktualisieren: ' + result.error);
			}
		} catch (error) {
			console.error('Error:', error);
			alert('Ein unerwarteter Fehler ist aufgetreten');
		}
	}

	function getSeatClass(seat: any) {
		if (!seat) return 'seat-empty';
		if (seat.status === 'inactive') return 'seat-inactive';
		if (seat.isBooked) return 'booked';

		const categoryLower = seat.category?.toLowerCase() || 'regular';
		for (const [type, data] of Object.entries(seatTypes)) {
			if (categoryLower.includes(type)) {
				return data.class;
			}
		}
		return 'regular';
	}

	function handleSeatClick(rowIndex: number, colIndex: number) {
		console.log(
			`Sitz geklickt: row=${rowIndex}, col=${colIndex}, Wert=`,
			seatPlan[rowIndex][colIndex]
		);
	}

	function goBack() {
		goto('/admin/manage-screenings');
	}
</script>

<svelte:head>
	<title>Sitzplan für Vorstellung {screening?.screening_id || ''}</title>
</svelte:head>

<main>
	{#if !screening}
		<div class="error-message">Keine Vorstellung gefunden.</div>
	{:else}
		<div class="container">
			<div class="page-header">
				<button class="back-btn" on:click={goBack}>
					<Icon style="font-size: 1.25rem; margin-right: 0.5rem;" icon="ic:outline-arrow-back" />
					Zurück
				</button>
				<h1 class="page-title">Vorstellung {screening.screening_id}</h1>
				<button class="edit-toggle-btn" on:click={() => (isEditMode = !isEditMode)}>
					<Icon icon={isEditMode ? 'ic:baseline-close' : 'ic:baseline-edit'} />
					{isEditMode ? 'Abbrechen' : 'Bearbeiten'}
				</button>
			</div>

			<div class="info-card">
				{#if isEditMode}
					<form on:submit|preventDefault={handleEdit} class="edit-form">
						<div class="form-group">
								<label>
									Film suchen:
									<input
										type="text"
										bind:value={movieQuery}
										placeholder="Film suchen..."
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
									<p><strong>Ausgewählter Film:</strong> {selectedMovie.title}</p>
								{/if}
							</div>

						<div class="form-group">
							<label for="hall_id">Saal:</label>
							<select id="hall_id" bind:value={editForm.hall_id} required>
								{#each halls as hall}
									<option value={hall.id}>{hall.name}</option>
								{/each}
							</select>
						</div>

						<div class="form-group">
							<label for="start_time">Startzeit:</label>
							<input
								type="datetime-local"
								id="start_time"
								bind:value={editForm.start_time}
								required
							/>
						</div>

						<button type="submit" class="save-changes-btn">
							<Icon icon="ic:baseline-save" />
							Änderungen speichern
						</button>
					</form>
				{:else}
					<div class="info-item">
						<span class="label">Film:</span>
						<span class="value">{screening.movie_title}</span>
					</div>
					<div class="info-item">
						<span class="label">Saal:</span>
						<span class="value">{screening.hall_name} (ID: {screening.hall_id})</span>
					</div>
					<div class="info-item">
						<span class="label">Kapazität:</span>
						<span class="value">{screening.capacity}</span>
					</div>
					<div class="info-item">
						<span class="label">Startzeit:</span>
						<span class="value">{screening.start_time}</span>
					</div>
					<div class="info-item">
						<span class="label">Endzeit:</span>
						<span class="value">{screening.end_time}</span>
					</div>
				{/if}
			</div>

			<div class="seating-section">
				<div class="screen-container">
					<div class="screen" />
					<p class="screen-label">Leinwand</p>
				</div>

				<div class="seat-plan">
					{#each seatPlan as row, rowIndex}
						<div class="seat-row">
							<div class="row-label">{String.fromCharCode(65 + rowIndex)}</div>
							{#each row.filter((seat) => seat !== null) as seat, colIndex}
								<button
									class="seat {getSeatClass(seat)}"
									title={`${seat.label} (${seat.category})`}
									on:click={() => handleSeatClick(rowIndex, colIndex)}
								>
									{seat.label}
								</button>
							{/each}
						</div>
					{/each}
				</div>

				<div class="seat-legend">
					{#each Object.entries(seatTypes) as [type, data]}
						<div class="legend-item">
							<div class="legend-box {data.class}" />
							<span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
							<span class="modifier">({data.modifier}x)</span>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
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

	.info-card {
		background-color: white;
		border-radius: 0.5rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.info-item {
		display: flex;
		padding: 0.8rem 0;
		border-bottom: 1px solid #e5e7eb;
	}

	.info-item:last-child {
		border-bottom: none;
	}

	.label {
		font-weight: 600;
		width: 120px;
		color: #374151;
	}

	.value {
		color: #1a1a1a;
	}

	.seating-section {
		background-color: white;
		padding: 2rem;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.screen-container {
		margin-bottom: 3rem;
		text-align: center;
	}

	.screen {
		height: 8px;
		background: linear-gradient(to right, #e2e8f0, #94a3b8, #e2e8f0);
		margin: 0 auto 1rem;
		width: 80%;
		border-radius: 4px;
	}

	.screen-label {
		font-size: 0.875rem;
		color: #666;
	}

	.seat-plan {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: center;
	}

	.seat-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.row-label {
		width: 2rem;
		text-align: right;
		font-weight: bold;
	}

	.seat {
		width: 2.5rem;
		height: 2.5rem;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #1a1a1a;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.seat:not(:disabled):hover {
		transform: scale(1.1);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.seat.vip {
		background-color: #fcd34d;
		color: #000;
	}
	.seat.premium {
		background-color: #f87171;
		color: #fff;
	}
	.seat.regular {
		background-color: #93c5fd;
		color: #000;
	}
	.seat.disabled {
		background-color: #86efac;
		color: #000;
	}
	.seat.seat-inactive {
		background-color: #9ca3af;
		color: #fff;
	}
	.seat.seat-empty {
		visibility: hidden;
	}
	.seat.booked {
		background-color: #9ca3af;
		cursor: not-allowed;
		color: #fff;
	}

	.seat-legend {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin-top: 2rem;
		flex-wrap: wrap;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.legend-box {
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 0.25rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.legend-box.vip {
		background-color: #fcd34d;
	}
	.legend-box.premium {
		background-color: #f87171;
	}
	.legend-box.regular {
		background-color: #93c5fd;
	}
	.legend-box.disabled {
		background-color: #86efac;
	}
	.legend-box.booked {
		background-color: #9ca3af;
	}

	.modifier {
		color: #666;
		font-size: 0.875rem;
	}

	.save-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 2rem auto 0;
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

	.save-button:hover {
		background-color: #218838;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.error-message {
		text-align: center;
		color: #ef4444;
		padding: 2rem;
	}

	@media (max-width: 768px) {
		.seat {
			width: 2rem;
			height: 2rem;
			font-size: 0.625rem;
		}

		.seat-legend {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}
	}
	.edit-toggle-btn {
		position: absolute;
		right: 0;
		top: 50%;
		transform: translateY(-50%);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		background-color: #f3f4f6;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		color: #374151;
		cursor: pointer;
		transition: all 0.2s;
	}

	.edit-form {
		display: grid;
		gap: 1rem;
	}

	.form-group {
		display: grid;
		gap: 0.5rem;
	}

	.form-group label {
		font-weight: 500;
		color: #374151;
	}

	.form-group input,
	.form-group select {
		padding: 0.5rem;
		border: 1px solid #e5e7eb;
		border-radius: 0.375rem;
		width: 100%;
	}

	.save-changes-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem;
		background-color: #28a745;
		color: white;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.save-changes-btn:hover {
		background-color: #218838;
	}

	/* Add these styles */
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
		margin-top: 0.25rem;
	}
</style>
