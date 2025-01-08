<script lang="ts">
    export let data: { halls: { id: number; name: string }[] };

    let movieQuery: string = '';
    let searchResults: { movie_id: string; title: string }[] = [];
    let selectedMovie: { movie_id: string; title: string } | null = null;

    let hall_id: number | null = null;

    // "start_time" aus dem datetime-local
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

    async function submitForm(event: Event) {
        event.preventDefault();
        saveMessage = null;

        console.log('[DEBUG] movie_id:', selectedMovie?.movie_id);
        console.log('[DEBUG] hall_id:', hall_id);
        console.log('[DEBUG] start_time:', start_time);

        if (!selectedMovie || !hall_id || !start_time) {
            saveMessage = 'Bitte füllen Sie alle Felder aus.';
            return;
        }

        const formData = new FormData();
        formData.append('movie_id', selectedMovie.movie_id); // => "tt1320253"
        formData.append('hall_id', String(hall_id));
        formData.append('start_time', start_time);

        const response = await fetch('/admin/manage-screenings/create-screening', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            saveMessage = result.message || 'Vorstellung erfolgreich erstellt!';
            // Reset
            selectedMovie = null;
            hall_id = null;
            start_time = null;
            movieQuery = '';
        } else {
            const error = await response.json();
            saveMessage = error.message || 'Fehler beim Erstellen der Vorstellung.';
        }
    }
</script>

<main>
    <div class="container">
        <h1>Neue Vorstellung erstellen</h1>

        {#if saveMessage}
            <p class="feedback">{saveMessage}</p>
        {/if}

        <form on:submit={submitForm} class="form">
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

            <label>
                Saal:
                <select name="hall_id" bind:value={hall_id}>
                    <option value="" disabled selected>Saal auswählen</option>
                    {#each data.halls as hall}
                        <option value={hall.id}>{hall.name}</option>
                    {/each}
                </select>
            </label>

            <label>
                Datum und Uhrzeit:
                <input type="datetime-local" name="start_time" bind:value={start_time} />
            </label>

            <button type="submit" class="submit-btn">Vorstellung erstellen</button>
        </form>
    </div>
</main>

<style>
    .container {
        max-width: 800px;
        margin: 30px auto;
        padding: 20px;
        background: #fff;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    h1 {
        text-align: center;
        margin-bottom: 20px;
        font-size: 24px;
        color: #333;
    }

    .form {
        display: flex;
        flex-direction: column;
        gap: 15px;
    }

    label {
        font-weight: bold;
        color: #444;
    }

    input,
    select {
        padding: 10px;
        font-size: 16px;
        border: 1px solid #ccc;
        border-radius: 5px;
        width: 100%;
    }

    input:focus,
    select:focus {
        border-color: #007bff;
        outline: none;
    }

    .search-results {
        list-style: none;
        padding: 0;
        margin: 10px 0;
        border: 1px solid #ddd;
        border-radius: 5px;
        max-height: 150px;
        overflow-y: auto;
        background-color: #fff;
    }

    .search-results li {
        padding: 10px;
        cursor: pointer;
        transition: background 0.2s ease;
    }

    .search-results li:hover {
        background-color: #f1f1f1;
    }

    .error {
        color: red;
        font-size: 14px;
    }

    .feedback {
        text-align: center;
        font-size: 16px;
        color: green;
        margin-bottom: 20px;
    }

    .submit-btn {
        background-color: #007bff;
        color: white;
        padding: 10px;
        font-size: 16px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: background 0.3s ease;
    }

    .submit-btn:hover {
        background-color: #0056b3;
    }
</style>