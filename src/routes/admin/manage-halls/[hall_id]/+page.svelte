<script lang="ts">
	export let data;
	const { hall, error } = data;

	if (!hall) {
		console.error(error);
	}

	let seatPlan = hall?.seat_plan ?? [];

	function handleSeatClick(rowIndex: number, colIndex: number) {
		console.log(`Seat clicked: row=${rowIndex}, col=${colIndex}`, seatPlan[rowIndex][colIndex]);
	}
</script>

<main>
	<h1>Saal: {hall?.name}</h1>
	<p>ID: {hall?.hall_id}</p>
	<p>Kapazität: {hall?.capacity}</p>

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

	<button class="save-button" on:click={() => console.log('Noch nichts implementiert')}>
		Sitzplan speichern
	</button>
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
	}
	.save-button:hover {
		background-color: #0056b3;
		transform: scale(1.05);
	}
</style>
