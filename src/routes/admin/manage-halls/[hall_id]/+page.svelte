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

	// Hilfsfunktion um den Sitztyp zu prüfen
	function getSeatClass(seat: string) {
		if (!seat) return 'seat-empty';
		// Vergleiche case-insensitive
		const seatLower = seat.toLowerCase();
		if (seatLower === 'regular') return 'regular';
		if (seatLower === 'vip') return 'vip';
		if (seatLower === 'behindert') return 'disabled';
		return 'regular'; // Fallback
	}
</script>

<main>
	{#if hall}
		<div class="container">
			<h1 class="movie-title">{hall.name}</h1>
			<p class="hall-info">Kapazität: {hall.capacity} | ID: {hall.hall_id}</p>

			<div class="booking-container">
				<div class="seating-section">
					<div class="screen-container">
						<div class="screen"></div>
						<p class="screen-label">Leinwand</p>
					</div>

					<div class="seat-plan">
						{#each seatPlan as row, rowIndex}
							<div class="seat-row">
								{#each row as seat, colIndex}
									<button
										class="seat-button {getSeatClass(seat)}"
										disabled={!seat}
										on:click={() => handleSeatClick(rowIndex, colIndex)}
									>
										{seat ? seat[0] : ''}
									</button>
								{/each}
							</div>
						{/each}
					</div>

					<div class="seat-legend">
						<div class="legend-item">
							<div class="legend-box regular"></div>
							<span>Regular</span>
						</div>
						<div class="legend-item">
							<div class="legend-box vip"></div>
							<span>VIP</span>
						</div>
						<div class="legend-item">
							<div class="legend-box disabled"></div>
							<span>Behindert</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="error-container">
			<h1 class="error-message">{error}</h1>
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

	.movie-title {
		font-size: 2rem;
		font-weight: 600;
		color: #1a1a1a;
		margin-bottom: 0.5rem;
		text-align: center;
	}

	.hall-info {
		text-align: center;
		color: #666;
		margin-bottom: 2rem;
	}

	.booking-container {
		display: flex;
		justify-content: center;
		gap: 2rem;
	}

	.seating-section {
		background: white;
		padding: 2rem;
		border-radius: 1rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		width: 100%;
		max-width: 800px;
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
		margin-bottom: 2rem;
	}

	.seat-row {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.seat-button {
		width: 2.5rem;
		height: 2.5rem;
		border: none;
		border-radius: 0.375rem;
		background-color: #e5e7eb;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.875rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.seat-button:not(:disabled):hover {
		transform: scale(1.1);
	}

	.seat-button.regular {
		background-color: #93c5fd;
	}

	.seat-button.vip {
		background-color: #fcd34d;
	}

	.seat-button.disabled {
		background-color: #86efac;
	}

	.seat-button.seat-empty {
		visibility: hidden;
	}

	.seat-legend {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin-top: 2rem;
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
	}

	.legend-box.regular {
		background-color: #93c5fd;
	}

	.legend-box.vip {
		background-color: #fcd34d;
	}

	.legend-box.disabled {
		background-color: #86efac;
	}

	.error-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 50vh;
	}

	.error-message {
		color: #ef4444;
		font-size: 1.5rem;
	}

	@media (max-width: 640px) {
		.seat-button {
			width: 2rem;
			height: 2rem;
			font-size: 0.75rem;
		}

		.seat-legend {
			flex-direction: column;
			align-items: center;
			gap: 1rem;
		}
	}
</style>
