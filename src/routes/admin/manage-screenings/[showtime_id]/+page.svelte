<script lang="ts">
	export let data;
	const { screening } = data;

	let seatPlan = screening?.seat_plan ?? [];

	function handleSeatClick(rowIndex: number, colIndex: number) {
		console.log(`Sitz geklickt:`, seatPlan[rowIndex][colIndex]);
	}

	async function updateSeatPlan() {
		const formData = new FormData();
		formData.append('new_seat_plan', JSON.stringify(seatPlan));

		const response = await fetch('?/updateSeatPlan', {
			method: 'POST',
			body: formData
		});
		const result = await response.json();
		if (result.success) {
			alert('Sitzplan erfolgreich aktualisiert!');
		} else {
			alert('Fehler: ' + result.error);
		}
	}
</script>

<svelte:head>
	<title>Vorstellung: {screening?.showtime_id}</title>
</svelte:head>
<main>
	{#if !screening}
		<p>Keine Vorstellung gefunden.</p>
	{:else}
		<h1>Vorstellung {screening.showtime_id}</h1>
		<p><b>Film-ID:</b> {screening.movie_id}</p>
		<p><b>Saal:</b> {screening.hall_name} (ID: {screening.hall_id})</p>
		<p><b>Kapazität:</b> {screening.capacity}</p>
		<p><b>Zeit:</b> {screening.showtime}</p>

		<h2>Sitzplan</h2>
		{#if Array.isArray(seatPlan) && seatPlan.length > 0}
			<div class="seat-plan">
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
			</div>
		{:else}
			<p>Kein Sitzplan vorhanden.</p>
		{/if}

		<button class="save-button" on:click={updateSeatPlan}>Sitzplan speichern</button>
	{/if}
</main>

<style>
	main {
		padding: 20px;
		font-family: Arial, sans-serif;
	}

	h1 {
		color: #333;
	}

	h2 {
		margin-top: 20px;
		color: #555;
	}

	.seat-plan {
		display: grid;
		gap: 10px;
		margin-top: 20px;
	}

	.seat-row {
		display: flex;
		gap: 8px;
	}

	.seat {
		padding: 10px;
		border: 1px solid #ccc;
		border-radius: 4px;
		background-color: #f9f9f9;
		cursor: pointer;
		transition: background-color 0.3s;
	}

	.seat:hover {
		background-color: #e0e0e0;
	}

	.save-button {
		margin-top: 20px;
		padding: 10px 20px;
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		transition: background-color 0.3s;
	}

	.save-button:hover {
		background-color: #0056b3;
	}
</style>
