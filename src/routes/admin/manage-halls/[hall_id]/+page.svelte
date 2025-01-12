<script lang="ts">
	export let data;

	let { hall, error } = data;

	const seatTypes = {
		vip: { modifier: 5.0, class: 'vip' },
		premium: { modifier: 3.0, class: 'premium' },
		regular: { modifier: 1.0, class: 'regular' },
		standard: { modifier: 1.0, class: 'standard' },
		disabled: { modifier: 0.8, class: 'disabled' }
	};

	function getSeat(rowIndex: number, colIndex: number) {
		const existingSeat = hall?.seat_plan?.[rowIndex]?.[colIndex];
		if (existingSeat) {
			return {
				...existingSeat,
				label: `${String.fromCharCode(65 + rowIndex)}${colIndex + 1}`
			};
		}
		return {
			label: `${String.fromCharCode(65 + rowIndex)}${colIndex + 1}`,
			category: 'regular',
			status: 'active'
		};
	}

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
</script>

<main>
	{#if hall}
		<div class="container">
			<header class="header">
				<h1 class="title">{hall.name}</h1>
				<p class="info">
					Capacity: {hall.total_seats} seats | Rows: {hall.total_rows} | Columns: {hall.total_columns}
				</p>
			</header>

			<div class="seating-section">
				<div class="screen-container">
					<div class="screen"></div>
					<p class="screen-label">Screen</p>
				</div>

				<div class="seat-plan">
					{#each Array(hall.total_rows) as _, rowIndex}
						<div class="seat-row">
							<div class="row-label">{String.fromCharCode(65 + rowIndex)}</div>
							{#each Array(hall.total_columns) as _, colIndex}
								{@const seat = getSeat(rowIndex, colIndex)}
								<button
									class="seat {getSeatClass(seat)}"
									title={`${seat.label} (${seat.category})`}
								>
									{seat.label}
								</button>
							{/each}
						</div>
					{/each}
				</div>

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
	{:else}
		<div class="error">
			<h1>{error}</h1>
		</div>
	{/if}
</main>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
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

	.controls {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.edit-mode {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

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

	/* Updated seat type colors */
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

	/* Legend box colors matching seat colors */
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

	.error {
		text-align: center;
		color: #ef4444;
		padding: 2rem;
	}

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
