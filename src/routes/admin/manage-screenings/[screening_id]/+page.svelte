<script lang="ts">
	export let data;
	const { screening } = data;
	let seatPlan = screening?.seat_plan ?? [];

	// Definiert die verschiedenen Sitztypen, ihre Modifikatoren und CSS-Klassen
	const seatTypes = {
		vip: { modifier: 5.0, class: 'vip' },
		premium: { modifier: 3.0, class: 'premium' },
		regular: { modifier: 1.0, class: 'regular' },
		standard: { modifier: 1.0, class: 'standard' },
		disabled: { modifier: 0.8, class: 'disabled' }
	};

	// Falls ein Sitz nicht existiert, wird ein Standard-Sitz mit Label und Kategorie "regular" erstellt
	function getSeat(rowIndex: number, colIndex: number) {
		const existingSeat = seatPlan?.[rowIndex]?.[colIndex];
		if (existingSeat) {
			return existingSeat; // Verwende den existierenden Sitz (aus der Datenbank)
		}
		return {
			label: `${String.fromCharCode(65 + rowIndex)}${colIndex + 1}`,
			category: 'regular',
			status: 'active'
		};
	}

	// Gibt anhand der Sitzkategorie die entsprechende CSS-Klasse zurück
	function getSeatClass(seat: any) {
		if (!seat) return 'seat-empty';
		if (seat.status === 'inactive') return 'seat-inactive';

		const categoryLower = seat.category?.toLowerCase() || 'regular';
		for (const [type, data] of Object.entries(seatTypes)) {
			if (categoryLower.includes(type)) {
				return data.class;
			}
		}
		return 'regular';
	}

	// Beim Klick auf einen Sitz wird dieser in der Konsole protokolliert
	function handleSeatClick(rowIndex: number, colIndex: number) {
		console.log(
			`Sitz geklickt: row=${rowIndex}, col=${colIndex}, Wert=`,
			seatPlan[rowIndex][colIndex]
		);
	}

	// Aktualisiert den Sitzplan via POST-Anfrage
	async function updateSeatPlan() {
		const formData = new FormData();
		formData.append('new_seat_plan', JSON.stringify(seatPlan));
		const response = await fetch('./updateSeatPlan', {
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
	<title>Vorstellung: {screening?.screening_id}</title>
</svelte:head>

<main>
	{#if !screening}
		<div class="error-message">Keine Vorstellung gefunden.</div>
	{:else}
		<!-- Screening-Header und Info-Card bleiben erhalten -->
		<div class="screening-header">
			<h1>Vorstellung {screening.screening_id}</h1>
		</div>

		<div class="info-card">
			<div class="info-item">
				<span class="label">Film-ID:</span>
				<span class="value">{screening.movie_id}</span>
			</div>
			<div class="info-item">
				<span class="label">Saal:</span>
				<span class="value">{screening.hall_name} (ID: {screening.hall_id})</span>
			</div>
			<div class="info-item">
				<span class="label">Kapazität:</span>
				<span class="value">{screening.capacity}</span>
			</div>
			<div class="info-item">
				<span class="label">Startzeit:</span>
				<span class="value">{screening.start_time}</span>
			</div>
			<div class="info-item">
				<span class="label">Endzeit:</span>
				<span class="value">{screening.end_time}</span>
			</div>
		</div>

		<!-- Neuer Container für den Sitzplan im Stil des ersten Beispiels -->
		<div class="container">
			<header class="header">
				<h1 class="title">{screening.hall_name}</h1>
				<p class="info">
					Capacity: {screening.capacity} seats
				</p>
			</header>

			<div class="seating-section">
				<div class="screen-container">
					<div class="screen"></div>
					<p class="screen-label">Screen</p>
				</div>

				<!-- Sitzplan wird zeilenweise ausgegeben -->
				<div class="seat-plan">
					{#each seatPlan as row, rowIndex}
						<div class="seat-row">
							<div class="row-label">{String.fromCharCode(65 + rowIndex)}</div>
							{#each row.filter(seat => seat !== null) as seat, colIndex}
								<button
									class="seat {getSeatClass(seat)}"
									title={`${seat.label} (${seat.category})`}
									on:click={() => handleSeatClick(rowIndex, colIndex)}
								>
									{seat.label}
								</button>
							{/each}
						</div>
					{/each}
				</div>

				<!-- Sitzlegende -->
				<div class="seat-legend">
					{#each Object.entries(seatTypes) as [type, data]}
						<div class="legend-item">
							<div class="legend-box {data.class}"></div>
							<span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
							<span class="modifier">({data.modifier}x)</span>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<button class="save-button" on:click={updateSeatPlan}>
			<i class="fas fa-save"></i> Sitzplan speichern
		</button>
	{/if}
</main>

<style>
	/* Container & allgemeine Layouts */
	main {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
	}
	.container {
		max-width: 1200px;
		margin: 2rem auto;
		padding: 2rem;
	}

	.header {
		text-align: center;
		margin-bottom: 2rem;
	}
	.title {
		font-size: 2rem;
		margin: 0;
	}
	.info {
		color: #666;
		margin: 0.5rem 0;
	}

	/* Screening-Header & Info-Card */
	.screening-header {
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid #eee;
	}
	h1 {
		color: #2c3e50;
		font-size: 2.5rem;
		margin: 0;
	}
	.info-card {
		background: white;
		border-radius: 10px;
		padding: 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}
	.info-item {
		display: flex;
		padding: 0.8rem 0;
		border-bottom: 1px solid #eee;
	}
	.info-item:last-child {
		border-bottom: none;
	}
	.label {
		font-weight: 600;
		width: 120px;
		color: #7f8c8d;
	}
	.value {
		color: #2c3e50;
	}

	/* Seating Section */
	.seating-section {
		background: white;
		padding: 2rem;
		border-radius: 1rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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
		font-size: 0.9rem;
		color: #555;
	}

	.seat-plan {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: center;
	}
	.seat-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
	.row-label {
		width: 2rem;
		text-align: right;
		font-weight: bold;
	}

	/* Sitz-Buttons */
	.seat {
		width: 2.5rem;
		height: 2.5rem;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #1a1a1a;
	}
	.seat:not(:disabled):hover {
		transform: scale(1.1);
	}

	/* Sitztypen Farben */
	.seat.vip {
		background-color: #fcd34d;
		color: #000;
	}
	.seat.premium {
		background-color: #f87171;
		color: #fff;
	}
	.seat.regular {
		background-color: #93c5fd;
		color: #000;
	}
	.seat.standard {
		background-color: #e5e7eb;
		color: #000;
	}
	.seat.disabled {
		background-color: #86efac;
		color: #000;
	}
	.seat.seat-inactive {
		background-color: #9ca3af;
		color: #fff;
	}
	.seat.seat-empty {
		visibility: hidden;
	}

	/* Sitzlegende */
	.seat-legend {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin-top: 2rem;
		flex-wrap: wrap;
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
	.legend-box.vip {
		background-color: #fcd34d;
	}
	.legend-box.premium {
		background-color: #f87171;
	}
	.legend-box.regular {
		background-color: #93c5fd;
	}
	.legend-box.standard {
		background-color: #e5e7eb;
	}
	.legend-box.disabled {
		background-color: #86efac;
	}
	.modifier {
		color: #666;
		font-size: 0.875rem;
	}

	/* Speichern-Button */
	.save-button {
		margin-top: 2rem;
		padding: 1rem 2rem;
		background-color: #2ecc71;
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1.1rem;
		font-weight: 600;
		transition: all 0.2s ease;
		display: block;
		width: 100%;
		max-width: 300px;
		margin-left: auto;
		margin-right: auto;
	}
	.save-button:hover {
		background-color: #27ae60;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(46, 204, 113, 0.2);
	}

	/* Fehlermeldung */
	.error-message {
		padding: 1rem;
		background-color: #fff3f3;
		border: 1px solid #ffcdd2;
		border-radius: 8px;
		color: #e74c3c;
		text-align: center;
	}
	
	/* Responsive Anpassungen */
	@media (max-width: 768px) {
		.seat {
			width: 2rem;
			height: 2rem;
			font-size: 0.625rem;
		}
		.seat-legend {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}
	}
</style>
