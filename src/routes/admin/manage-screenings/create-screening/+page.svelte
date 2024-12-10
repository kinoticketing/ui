<script lang="ts">
    export let data: { halls: { hall_id: number; name: string }[] };

    let movieQuery: string = ''; // Eingabe für die Filmsuche
    let searchResults: { movie_id: string; title: string }[] = []; // Ergebnisse der Filmsuche
    let selectedMovie: { movie_id: string; title: string } | null = null; // Ausgewählter Film

    let hall_id: number | null = null;
    let showtime: string | null = null;
    let saveMessage: string | null = null;
    let searchError: string | null = null; // Fehlernachricht für die Suche

    async function fetchMovies() {
        if (!movieQuery.trim()) {
            searchResults = [];
            searchError = null;
            return;
        }

        try {
            const response = await fetch(`/admin/manage-screenings/search-movies?query=${encodeURIComponent(movieQuery)}`);
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

    async function submitForm() {
        saveMessage = null;

        if (!selectedMovie || !hall_id || !showtime) {
            saveMessage = 'Bitte füllen Sie alle Felder aus.';
            return;
        }

        const formData = new FormData();
        formData.append('actionType', 'createShowtime');
        formData.append('movie_id', selectedMovie.movie_id);
        formData.append('hall_id', String(hall_id));
        formData.append('showtime', showtime);

        try {
            const response = await fetch('/admin/manage-screenings/create-screening', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                saveMessage = result.message || 'Vorstellung erfolgreich erstellt!';
                selectedMovie = null;
                hall_id = null;
                showtime = null;
                movieQuery = '';
            } else {
                const error = await response.json();
                saveMessage = error.message || 'Fehler beim Erstellen der Vorstellung.';
            }
        } catch (error) {
            saveMessage = 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
            console.error('Netzwerkfehler:', error);
        }
    }
</script>

<main>
    <h1>Neue Vorstellung erstellen</h1>

    {#if saveMessage}
        <p class="feedback">{saveMessage}</p>
    {/if}

    <div class="form">
        <label>
            Film suchen:
            <input type="text" bind:value={movieQuery} placeholder="Film suchen..." on:input={fetchMovies} />
        </label>

        {#if searchError}
            <p class="error">{searchError}</p>
        {/if}

        {#if searchResults.length > 0}
            <ul class="search-results">
                {#each searchResults as movie}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
                    <li on:click={() => selectMovie(movie)}>{movie.title}</li>
                {/each}
            </ul>
        {:else if movieQuery.trim() !== ''}
            <p class="no-results">Keine Filme gefunden. Versuchen Sie es mit einem anderen Suchbegriff.</p>
        {/if}

        {#if selectedMovie}
            <p><strong>Ausgewählter Film:</strong> {selectedMovie.title}</p>
        {/if}

        <label>
            Saal:
            <select bind:value={hall_id}>
                <option value="" disabled selected>Saal auswählen</option>
                {#each data.halls as hall}
                    <option value={hall.hall_id}>{hall.name}</option>
                {/each}
            </select>
        </label>

        <label>
            Datum und Uhrzeit:
            <input type="datetime-local" bind:value={showtime} />
        </label>

        <button class="submit-btn" on:click={submitForm}>Vorstellung erstellen</button>
    </div>
</main>



<style>
	h1 {
		text-align: center;
		margin-bottom: 20px;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 15px;
		max-width: 400px;
		margin: 0 auto;
	}

	label {
		display: flex;
		flex-direction: column;
		font-weight: bold;
	}

	input, select {
		padding: 8px;
		font-size: 14px;
	}

	.search-results {
		list-style-type: none;
		padding: 0;
		background-color: #f9f9f9;
		border: 1px solid #ddd;
		border-radius: 5px;
		max-height: 150px;
		overflow-y: auto;
		margin-top: 5px;
	}

	.search-results li {
		padding: 10px;
		cursor: pointer;
	}

	.search-results li:hover {
		background-color: #e0e0e0;
	}

	.no-results {
		color: #666;
		font-style: italic;
		margin-top: 5px;
	}

	.error {
		color: red;
		font-size: 14px;
		margin-top: 10px;
	}

	.submit-btn {
		background-color: #28a745;
		color: white;
		padding: 10px;
		border: none;
		border-radius: 5px;
		font-size: 16px;
		cursor: pointer;
	}

	.submit-btn:hover {
		background-color: #218838;
	}

	.feedback {
		text-align: center;
		color: green;
		font-size: 16px;
		margin-bottom: 20px;
	}
</style>
