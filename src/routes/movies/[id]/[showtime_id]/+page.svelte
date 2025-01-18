<!-- src/routes/movies/[id]/[showtime_id]/+page.svelte -->
<script lang="ts">
	import Icon from '@iconify/svelte';
	import type { PriceResponse, SelectedSeat, PageData } from './types';
	import { onMount } from 'svelte';
	import { cart } from '$lib/stores/cart';
	export let data: PageData;

	const { movie, screening, error } = data;

	function goBackToMovie() {
		window.location.href = `/movies/${movie.imdb_id}`;
	}
	async function handleCheckout() {
		if (loading) return;

		loading = true;
		try {
			// Store selected seats in localStorage as backup
			localStorage.setItem('selectedSeats', JSON.stringify(selectedSeats));

			// Add to cart
			cart.addItem({
				screeningId: screening.id,
				movieTitle: movie.title,
				screeningTime: screening.start_time,
				tickets: selectedSeats.map((seat) => ({
					seatId: seat.seatId,
					row: seat.row,
					col: seat.col,
					label: seat.label,
					price: seat.price,
					categoryName: seat.categoryName
				})),
				movieImageUrl: '/fallback-image.jpg'
			});

			// Navigate to cart
			window.location.href = '/cart';
		} catch (error) {
			console.error('Add to cart error:', error);
			alert('Failed to add tickets to cart. Please try again.');
		} finally {
			loading = false;
		}
	}

	let selectedSeats: SelectedSeat[] = [];
	let loading = false;
	let timeoutId: ReturnType<typeof setTimeout>;

	onMount(async () => {
		// Check for stored seats
		const storedSeats = localStorage.getItem('selectedSeats');
		if (storedSeats) {
			const seats = JSON.parse(storedSeats);
			// Re-lock each seat
			for (const seat of seats) {
				try {
					const lockResponse = await fetch(`/api/seats/${seat.seatId}/lock`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ screeningId: screening.id })
					});

					if (lockResponse.ok) {
						selectedSeats = [...selectedSeats, seat];
					}
				} catch (error) {
					console.error('Error relocking seat:', error);
				}
			}
			// Clear stored seats after retrieving them
			localStorage.removeItem('selectedSeats');
		}
	});

	async function getSeatPrice(seatId: number): Promise<PriceResponse> {
		if (timeoutId) clearTimeout(timeoutId);

		return new Promise((resolve, reject) => {
			timeoutId = setTimeout(async () => {
				try {
					const response = await fetch(`/api/seats/${seatId}/price?screeningId=${screening.id}`);
					const data = await response.json();

					if (!response.ok) {
						throw new Error(data.error || 'Failed to get seat price');
					}
					resolve(data);
				} catch (error) {
					reject(error);
				}
			}, 300);
		});
	}

	async function handleSeatClick(rowIndex: number, colIndex: number, seat: any) {
		if (!seat || seat.isBooked || loading) return;

		loading = true;
		const seatKey = `${rowIndex}-${colIndex}`;

		try {
			if (selectedSeats.some((s) => s.key === seatKey)) {
				await fetch(`/api/seats/${seat.id}/lock`, {
					method: 'DELETE'
				});
				selectedSeats = selectedSeats.filter((s) => s.key !== seatKey);
			} else {
				if (selectedSeats.length >= 10) {
					alert('Maximum 10 seats can be selected at once');
					return;
				}

				const lockResponse = await fetch(`/api/seats/${seat.id}/lock`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ screeningId: screening.id })
				});

				if (!lockResponse.ok) {
					const error = await lockResponse.json();
					alert(error.error || 'Seat is no longer available');
					return;
				}

				const priceData = await getSeatPrice(seat.id);
				const numericPrice =
					typeof priceData.price === 'string' ? parseFloat(priceData.price) : priceData.price;

				selectedSeats = [
					...selectedSeats,
					{
						key: seatKey,
						row: rowIndex + 1,
						col: colIndex + 1,
						label: seat.seat_label,
						seatId: seat.id,
						price: numericPrice,
						categoryName: seat.category.name
					}
				];
			}
		} catch (e) {
			console.error('Error handling seat selection:', e);
			alert('Failed to process seat selection. Please try again.');
		} finally {
			loading = false;
		}
	}

	$: totalPrice = selectedSeats.reduce((sum, seat) => {
		const seatPrice = typeof seat.price === 'string' ? parseFloat(seat.price) : seat.price;
		return sum + (isNaN(seatPrice) ? 0 : seatPrice);
	}, 0);

	function removeSeat(seatKey: string) {
		const seat = selectedSeats.find((s) => s.key === seatKey);
		if (seat) {
			fetch(`/api/seats/${seat.seatId}/lock`, {
				method: 'DELETE'
			}).catch((error) => {
				console.error('Error unlocking seat:', error);
			});
		}
		selectedSeats = selectedSeats.filter((seat) => seat.key !== seatKey);
	}

	function formatDateTime(dateString: string) {
		return new Date(dateString).toLocaleString();
	}

	function formatPrice(price: string | number): string {
		const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
		if (isNaN(numericPrice)) return '0.00';
		return numericPrice.toFixed(2);
	}

	function getCategoryColor(categoryName: string): string {
		switch (categoryName.toLowerCase()) {
			case 'vip':
				return '#fbbf24';
			case 'premium':
				return '#60a5fa';
			default:
				return '#e5e7eb';
		}
	}
</script>

<main>
	{#if !error}
		<div class="container">
			<button class="back-button" on:click={goBackToMovie}>
				<Icon icon="mdi:arrow-left" width="20" height="20" />
				Back to Movie
			</button>
			<h1 class="movie-title">{movie.title}</h1>
			<p class="showtime-info">Showtime: {formatDateTime(screening.start_time)}</p>

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
										style={seat
											? `background-color: ${
													selectedSeats.some((s) => s.key === `${rowIndex}-${colIndex}`)
														? '#3b82f6'
														: getCategoryColor(seat.category.name)
												}`
											: ''}
										disabled={!seat || seat.isBooked}
										on:click={() => handleSeatClick(rowIndex, colIndex, seat)}
									>
										{seat?.seat_label ?? ''}
									</button>
								{/each}
							</div>
						{/each}
					</div>

					<div class="seat-legend">
						<div class="legend-item">
							<div class="legend-box standard"></div>
							<span>Standard</span>
						</div>
						<div class="legend-item">
							<div class="legend-box premium"></div>
							<span>Premium</span>
						</div>
						<div class="legend-item">
							<div class="legend-box vip"></div>
							<span>VIP</span>
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
											<p class="seat-label">Seat {seat.label} ({seat.categoryName})</p>
											<p class="seat-details">Row {seat.row}, Column {seat.col}</p>
											<p class="ticket-price">${formatPrice(seat.price)}</p>
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
								<span>${formatPrice(totalPrice)}</span>
							</div>

							<button
								class="checkout-button"
								disabled={selectedSeats.length === 0}
								on:click={handleCheckout}
							>
								Proceed to Checkout
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
	/* Previous styles remain the same */
	.container {
		max-width: 1200px;
		margin: 0 auto;
		position: relative; /* Change from your original */
	}

	.back-button {
		position: absolute;
		left: 0;
		top: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		background-color: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		color: #374151;
		font-weight: 500;
		transition: all 0.2s ease;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.back-button:hover {
		background-color: #f3f4f6;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.legend-box.standard {
		background-color: #e5e7eb;
	}

	.legend-box.premium {
		background-color: #60a5fa;
	}

	.legend-box.vip {
		background-color: #fbbf24;
	}

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
		height: 650px;
		display: flex;
		flex-direction: column;
	}

	.screen-container {
		margin-bottom: 2rem;
		text-align: center;
		flex-shrink: 0;
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
		flex-grow: 1;
		overflow-y: auto;
		padding-right: 0.5rem;
		scrollbar-width: thin;
		scrollbar-color: #cbd5e1 #f1f5f9;
	}

	.seat-plan::-webkit-scrollbar {
		width: 6px;
	}

	.seat-plan::-webkit-scrollbar-track {
		background: #f1f5f9;
		border-radius: 3px;
	}

	.seat-plan::-webkit-scrollbar-thumb {
		background: #cbd5e1;
		border-radius: 3px;
	}

	.seat-plan::-webkit-scrollbar-thumb:hover {
		background: #94a3b8;
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
		flex-shrink: 0;
		padding-top: 1rem;
		border-top: 1px solid #e5e7eb;
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
		display: flex;
		flex-direction: column;
		height: calc(100vh - 8rem);
		max-height: 800px;
	}

	.cart-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.tickets-container {
		flex-grow: 1;
		overflow-y: auto;
		margin-bottom: 1rem;
		padding-right: 0.5rem;
		scrollbar-width: thin;
		scrollbar-color: #cbd5e1 #f1f5f9;
	}

	.tickets-container::-webkit-scrollbar {
		width: 6px;
	}

	.tickets-container::-webkit-scrollbar-track {
		background: #f1f5f9;
		border-radius: 3px;
	}

	.tickets-container::-webkit-scrollbar-thumb {
		background: #cbd5e1;
		border-radius: 3px;
	}

	.tickets-container::-webkit-scrollbar-thumb:hover {
		background: #94a3b8;
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
		margin-top: auto;
	}

	.total-price {
		display: flex;
		justify-content: space-between;
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
	}

	.checkout-button {
		background-color: #2563eb;
		color: white;
	}

	.checkout-button:hover:not(:disabled) {
		background-color: #1d4ed8;
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

		.cart-container {
			height: auto;
			max-height: 500px;
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
