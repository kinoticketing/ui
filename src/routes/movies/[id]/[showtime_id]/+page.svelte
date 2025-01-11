<!-- src/routes/movies/[id]/[showtime_id]/+page.svelte -->
<script lang="ts">
	import Icon from '@iconify/svelte';
    import type { PageData } from './types'
	export let data: PageData;

	const { movie, screening, error } = data;
	const TICKET_PRICE = 12.99;

	let selectedSeats: Array<{
		key: string;
		row: number;
		col: number;
		label: string;
	}> = [];

	function handleSeatClick(rowIndex: number, colIndex: number, seat: any) {
		if (!seat || seat.isBooked) return;

		const seatKey = `${rowIndex}-${colIndex}`;
		const existingSeatIndex = selectedSeats.findIndex((s) => s.key === seatKey);

		if (existingSeatIndex !== -1) {
			selectedSeats = selectedSeats.filter((s) => s.key !== seatKey);
		} else {
			selectedSeats = [
				...selectedSeats,
				{
					key: seatKey,
					row: rowIndex + 1,
					col: colIndex + 1,
					label: seat.label
				}
			];
		}
	}

	function removeSeat(seatKey: string) {
		selectedSeats = selectedSeats.filter((seat) => seat.key !== seatKey);
	}

	async function handleCheckout() {
		// Implement your checkout logic here
		console.log('Processing checkout for:', selectedSeats);
	}

	function formatDateTime(dateString: string) {
		return new Date(dateString).toLocaleString();
	}

	$: totalPrice = selectedSeats.length * TICKET_PRICE;
</script>

<main>
	{#if !error}
		<div class="container">
			<h1 class="movie-title">{movie.title}</h1>
			<p class="showtime-info">Showtime: {screening.startTime}</p>

			<div class="booking-container">
				<!-- Left side - Seating Plan -->
				<div class="seating-section">
					<div class="screen-container">
						<div class="screen"></div>
						<p class="screen-label">Screen</p>
					</div>

					<div class="seat-plan">
						{#each screening.hall.seatPlan as row, rowIndex}
							<div class="seat-row">
								{#each row as seat, colIndex}
									<button
										class="seat-button"
										class:seat-selected={selectedSeats.some(
											(s) => s.key === `${rowIndex}-${colIndex}`
										)}
										class:seat-booked={seat?.isBooked}
										class:seat-empty={!seat}
										disabled={!seat || seat.isBooked}
										on:click={() => handleSeatClick(rowIndex, colIndex, seat)}
									>
										{seat?.label ?? ''}
									</button>
								{/each}
							</div>
						{/each}
					</div>

					<div class="seat-legend">
						<div class="legend-item">
							<div class="legend-box available"></div>
							<span>Available</span>
						</div>
						<div class="legend-item">
							<div class="legend-box selected"></div>
							<span>Selected</span>
						</div>
						<div class="legend-item">
							<div class="legend-box booked"></div>
							<span>Booked</span>
						</div>
					</div>
				</div>

				<!-- Right side - Cart -->
				<div class="cart-section">
					<div class="cart-container">
						<h2 class="cart-title">Selected Tickets</h2>

						<div class="tickets-container">
							{#if selectedSeats.length === 0}
								<p class="no-tickets">No seats selected</p>
							{:else}
								{#each selectedSeats as seat (seat.key)}
									<div class="ticket-item">
										<div class="ticket-info">
											<p class="seat-label">Seat {seat.label}</p>
											<p class="seat-details">Row {seat.row}, Column {seat.col}</p>
											<p class="ticket-price">${TICKET_PRICE.toFixed(2)}</p>
										</div>
										<button
											class="remove-button"
											on:click={() => removeSeat(seat.key)}
											aria-label="Remove ticket"
										>
											×
										</button>
									</div>
								{/each}
							{/if}
						</div>

						<div class="cart-footer">
							<div class="total-price">
								<span>Total:</span>
								<span>${totalPrice.toFixed(2)}</span>
							</div>

							<button
								class="checkout-button"
								disabled={selectedSeats.length === 0}
								on:click={handleCheckout}
							>
								Proceed to Checkout
							</button>

							<button class="paypal-button" disabled={selectedSeats.length === 0}>
								<Icon icon="mdi:paypal" />
								Pay with PayPal
							</button>
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

	.showtime-info {
		text-align: center;
		color: #666;
		margin-bottom: 2rem;
	}

	.booking-container {
		display: flex;
		gap: 2rem;
		align-items: flex-start;
	}

	.seating-section {
		flex: 3;
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

	.seat-selected {
		background-color: #3b82f6;
		color: white;
	}

	.seat-booked {
		background-color: #9ca3af;
		cursor: not-allowed;
	}

	.seat-empty {
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

	.legend-box.available {
		background-color: #e5e7eb;
	}

	.legend-box.selected {
		background-color: #3b82f6;
	}

	.legend-box.booked {
		background-color: #9ca3af;
	}

	.cart-section {
		flex: 2;
		position: sticky;
		top: 2rem;
	}

	.cart-container {
		background: white;
		padding: 1.5rem;
		border-radius: 1rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.cart-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.tickets-container {
		min-height: 200px;
		margin-bottom: 1.5rem;
	}

	.no-tickets {
		text-align: center;
		color: #666;
		padding: 2rem 0;
	}

	.ticket-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background-color: #f8f9fa;
		border-radius: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.ticket-info {
		flex-grow: 1;
	}

	.seat-label {
		font-weight: 600;
		margin-bottom: 0.25rem;
	}

	.seat-details {
		font-size: 0.875rem;
		color: #666;
		margin-bottom: 0.25rem;
	}

	.ticket-price {
		font-weight: 500;
		color: #2563eb;
	}

	.remove-button {
		background: none;
		border: none;
		color: #ef4444;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 50%;
		transition: background-color 0.2s;
	}

	.remove-button:hover {
		background-color: #fee2e2;
	}

	.cart-footer {
		border-top: 1px solid #e5e7eb;
		padding-top: 1.5rem;
	}

	.total-price {
		display: flex;
		justify-content: space-between;
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
	}

	.checkout-button,
	.paypal-button {
		width: 100%;
		padding: 0.875rem;
		border: none;
		border-radius: 0.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		margin-bottom: 0.75rem;
	}

	.checkout-button {
		background-color: #2563eb;
		color: white;
	}

	.checkout-button:hover:not(:disabled) {
		background-color: #1d4ed8;
	}

	.paypal-button {
		background-color: #fcd34d;
		color: #1a1a1a;
	}

	.paypal-button:hover:not(:disabled) {
		background-color: #fbbf24;
	}

	.checkout-button:disabled,
	.paypal-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
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

	@media (max-width: 1024px) {
		.booking-container {
			flex-direction: column;
		}

		.cart-section {
			position: static;
			width: 100%;
		}

		.seating-section {
			width: 100%;
		}
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
