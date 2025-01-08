<script lang="ts">
	// Die vom Server geladenen Daten
	export let data;

	const { hall, error } = data;

	// Falls kein Hall-Objekt vorhanden, gab es einen Fehler
	if (!hall) {
		console.error(error);
	}

	// Der 2D-Sitzplan, den wir vom Server bekommen
	let seatPlan = hall?.seat_plan ?? [];

	// Beispiel: Klick auf einzelnen Sitz
	function handleSeatClick(rowIndex: number, colIndex: number) {
		console.log(`Seat clicked: row=${rowIndex}, col=${colIndex}`, seatPlan[rowIndex][colIndex]);
	}
</script>

<main>
	{#if hall}
		<h1>Saal: {hall.name}</h1>
		<p>ID: {hall.hall_id}</p>
		<p>Kapazität: {hall.capacity}</p>

		<h2>Sitzplan</h2>
		{#if Array.isArray(seatPlan) && seatPlan.length > 0}
			{#each seatPlan as row, rowIndex}
				<div class="seat-row">
					{#each row as seat, colIndex}
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<div class="seat" on:click={() => handleSeatClick(rowIndex, colIndex)}>
							{seat}
						</div>
					{/each}
				</div>
			{/each}
		{:else}
			<p>Kein (oder leerer) Sitzplan vorhanden.</p>
		{/if}

		<!-- Ein Button zum Sitzplan-Update, falls du das implementiert hast -->
		<button class="save-button" on:click={() => console.log('Noch nichts implementiert')}>
			Sitzplan aktualisieren
		</button>
	{:else}
		<h1 style="color: red;">{error}</h1>
	{/if}
</main>

<style>
	h1 {
		color: #333;
		font-size: 2em;
		margin-bottom: 0.5em;
	}
	p {
		color: #666;
		margin: 0.2em 0;
	}
	h2 {
		color: #444;
		margin-top: 1.5em;
	}
	.seat-row {
		display: flex;
		gap: 8px;
		margin-bottom: 8px;
	}
	.seat {
		padding: 10px 15px;
		border: 1px solid #ccc;
		border-radius: 4px;
		cursor: pointer;
		background-color: #f9f9f9;
		transition:
			background-color 0.3s,
			transform 0.3s;
	}
	.seat:hover {
		background-color: #e0e0e0;
		transform: scale(1.05);
	}
	.save-button {
		padding: 10px 20px;
		border: none;
		border-radius: 4px;
		background-color: #007bff;
		color: white;
		cursor: pointer;
		transition:
			background-color 0.3s,
			transform 0.3s;
		margin-top: 20px;
	}
	.save-button:hover {
		background-color: #0056b3;
		transform: scale(1.05);
	}
</style>
