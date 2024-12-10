<script>
    let adminName = "Admin";
</script>

<main>
    <h1>Willkommen, {adminName}!</h1>
    <p>Dies ist die Administrationsseite für das Kinoticketreservierungsprogramm.</p>
    <p>Hier können Sie Reservierungen verwalten, Filme hinzufügen, Vorstellungen anlegen und vieles mehr.</p>
    <div>
        <button on:click={() => window.location.href = '/admin/manage-halls'}>Säle verwalten</button>
        <button on:click={() => window.location.href = '/admin/manage-screenings'}>Vorstellungen verwalten</button>
        <button on:click={() => window.location.href = '/admin/manage-reservations'}>Reservierungen verwalten</button>
    </div>

    <style>
        button {
            margin: 0.5rem;
            padding: 0.5rem 1rem;
            background-color: #3498db;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }

        button:hover {
            background-color: #2980b9;
        }
    </style>
</main>

<style>
    main {
        padding: 2rem;
        text-align: center;
    }

    h1 {
        color: #2c3e50;
    }

    p {
        color: #34495e;
    }
</style>