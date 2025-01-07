<script lang="ts">
	export let data;
	const { hall, error } = data;
  
	// falls kein Saal
	if (!hall) {
	  console.error(error);
	}
  
	// seat_plan ist laut deiner Log-Ausgabe: [ [ 'Regular' ] ]
	let seatPlan = hall?.seat_plan ?? [];
	
	function handleSeatClick(rowIndex: number, colIndex: number) {
	  console.log(
		`Seat clicked: row=${rowIndex}, col=${colIndex}`,
		seatPlan[rowIndex][colIndex]
	  );
	}
  </script>
  
  <h1>Saal: {hall?.name}</h1>
  <p>ID: {hall?.hall_id}</p>
  <p>Kapazität: {hall?.capacity}</p>
  
  <h2>Sitzplan</h2>
  {#if Array.isArray(seatPlan) && seatPlan.length > 0}
	{#each seatPlan as row, rowIndex}
	  <div class="seat-row">
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		{#each row as seat, colIndex}
		  <!-- seat ist hier ein String, also "Regular". 
			   Wenn du seat.label schreibst, wäre das undefined. -->
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
  
  <button on:click={() => console.log('Noch nichts implementiert')}>
	Sitzplan speichern
  </button>
  
  <style>
	.seat-row { display: flex; gap: 8px; }
	.seat {
	  padding: 6px 10px;
	  border: 1px solid #ccc;
	  cursor: pointer;
	}
  </style>
  