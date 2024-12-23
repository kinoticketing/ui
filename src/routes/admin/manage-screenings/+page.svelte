<script lang="ts">
    import { goto } from '$app/navigation';

    export let data: {
        showtimes: {
            showtime_id: number;
            showtime: string;
            movie_title: string; // IMDB-ID wird als Titel verwendet
            hall_name: string;
        }[];
    };

    // Navigation zur Detailseite
    function goToDetail(showtime_id: number) {
        goto(`/admin/manage-screenings/${showtime_id}`);
    }

    // Vorstellung löschen
    async function deleteShowtime(showtime_id: number) {
        const response = await fetch(`/admin/manage-screenings/${showtime_id}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            location.reload(); // Seite aktualisieren
        } else {
            alert('Fehler beim Löschen der Vorstellung.');
        }
    }

    function goToCreateScreening() {
        goto('/admin/manage-screenings/create-screening');
    }
</script>

<main>
    <h1>Alle Vorstellungen</h1>

    {#if data.showtimes.length > 0}
        <ul class="showtime-list">
            {#each data.showtimes as showtime}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
                <li class="showtime-item" on:click={() => goToDetail(showtime.showtime_id)}>
                    <p><strong>Film (IMDB-ID):</strong> {showtime.movie_title}</p>
                    <p><strong>Saal:</strong> {showtime.hall_name}</p>
                    <p><strong>Datum und Uhrzeit:</strong> {new Date(showtime.showtime).toLocaleString()}</p>
                    <button 
                        class="delete-btn" 
                        on:click|stopPropagation={() => deleteShowtime(showtime.showtime_id)}>
                        Vorstellung löschen
                    </button>
                </li>
            {/each}
        </ul>
    {:else}
        <p>Es sind keine Vorstellungen vorhanden.</p>
    {/if}

    <button class="create-showtime-btn" on:click={goToCreateScreening}>
        Neue Vorstellung erstellen
    </button>
</main>

<style>
    h1 {
        text-align: center;
        margin-bottom: 20px;
    }

    .showtime-list {
        list-style-type: none;
        padding: 0;
        max-width: 600px;
        margin: 0 auto 20px;
    }

    .showtime-item {
        background-color: #f9f9f9;
        padding: 15px;
        margin-bottom: 10px;
        border: 1px solid #ddd;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .showtime-item:hover {
        background-color: #e9ecef;
    }

    .delete-btn {
        background-color: #dc3545;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 14px;
        margin-top: 10px;
    }

    .delete-btn:hover {
        background-color: #c82333;
    }

    .create-showtime-btn {
        display: block;
        margin: 20px auto;
        padding: 10px 20px;
        font-size: 16px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    }

    .create-showtime-btn:hover {
        background-color: #0056b3;
    }
</style>
