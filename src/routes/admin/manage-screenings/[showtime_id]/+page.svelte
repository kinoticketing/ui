<!-- src/routes/admin/manage-screenings/[showtime_id]/+page.svelte -->
<script lang="ts">
	export let data;
	const { screening } = data;
	/*
	  screening enthält:
	  {
		showtime_id,
		movie_id,
		hall_id,
		showtime,
		hall_name,
		capacity,
		seat_plan
	  }
	*/

	// Falls seat_plan nicht existiert, nimm ein leeres Array (oder null)
	let seatPlan = screening?.seat_plan ?? [];

	function handleSeatClick(rowIndex: number, colIndex: number) {
		console.log(`Sitz geklickt:`, seatPlan[rowIndex][colIndex]);
	}

	async function updateSeatPlan() {
		const formData = new FormData();
		// Beispiel: Schick current seatPlan als JSON
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
			{#each seatPlan as row, rowIndex}
				<div class="seat-row">
					{#each row as seat, colIndex}
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<div class="seat" on:click={() => handleSeatClick(rowIndex, colIndex)}>
							<!-- Wenn seat nur ein String ist, gib ihn direkt aus -->
							{seat}
						</div>
					{/each}
				</div>
			{/each}
		{:else}
			<p>Kein Sitzplan vorhanden.</p>
		{/if}

		<button on:click={updateSeatPlan}>Sitzplan speichern</button>
	{/if}
</main>

<style>
	.seat-row {
		display: flex;
		gap: 8px;
	}
	.seat {
		padding: 6px 10px;
		border: 1px solid #ccc;
		cursor: pointer;
	}
</style>
