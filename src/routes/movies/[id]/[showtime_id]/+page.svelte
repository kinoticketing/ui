<!--src/routes/movies/[id]/[showtime_id]/+page.svelte-->
<script lang="ts">
	import Icon from '@iconify/svelte';
	import type { PriceResponse, SelectedSeat, PageData } from './types';
	import { onMount, onDestroy } from 'svelte';
	import { cart } from '$lib/stores/cart';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { t } from 'svelte-i18n';
	import '../../../../i18n.js';
	export let data: PageData;

	const { movie, screening, error } = data;

	function goBackToMovie() {
		window.location.href = `/movies/${movie.imdb_id}`;
	}

	let selectedSeats: SelectedSeat[] = [];
	let loading = false;
	let timeoutId: ReturnType<typeof setTimeout>;
	let showLoginModal = false;
	let pendingSeatSelection: { rowIndex: number; colIndex: number; seat: any } | null = null;

	function goToLogin() {
		localStorage.setItem(`selectedSeats_${screening.id}`, JSON.stringify(selectedSeats));
		localStorage.setItem('redirectUrl', `/movies/${movie.imdb_id}/${screening.id}`);
		goto('/auth/login');
	}

	// Add these type definitions at the top of your script section
	type CategoryType = 'vip' | 'premium' | 'regular' | 'disabled';

	interface CategoryDetails {
		background: string;
		text: string;
		modifier: number;
	}

	interface SeatStatus {
		seat_id: number;
		is_booked: boolean;
		is_locked: boolean;
		locked_by: string | null;
		status: string;
		is_available: boolean;
		current_user: string | null;
	}

	let seatStatuses = new Map<number, SeatStatus>();
	let statusUpdateInterval: ReturnType<typeof setInterval>;

	// Update the seatCategories declaration
	const seatCategories: Record<CategoryType, CategoryDetails> = {
		vip: { background: '#fcd34d', text: '#000', modifier: 5.0 },
		premium: { background: '#f87171', text: '#fff', modifier: 3.0 },
		regular: { background: '#93c5fd', text: '#000', modifier: 1.0 },
		disabled: { background: '#86efac', text: '#000', modifier: 0.8 }
	};

	async function updateSeatStatuses() {
		try {
			const statusPromises = screening.hall.seatPlan
				.flat()
				.filter((seat): seat is NonNullable<typeof seat> => seat !== null)
				.map(async (seat) => {
					const response = await fetch(`/api/seats/${seat.id}/status?screeningId=${screening.id}`);
					if (!response.ok) {
						const errorData = await response.json();
						throw new Error(errorData.error || `Failed to fetch status for seat ${seat.id}`);
					}
					const status = await response.json();
					return [seat.id, status] as [number, SeatStatus];
				});

			const statusResults = await Promise.all(statusPromises);
			seatStatuses = new Map(statusResults);

			// Check if any of our selected seats are no longer locked by us
			const expiredSeats = selectedSeats.filter((seat) => {
				const status = seatStatuses.get(seat.seatId);
				return !status?.is_locked || status.locked_by !== $page.data.session?.user?.id;
			});

			// Remove expired seats from selection
			if (expiredSeats.length > 0) {
				for (const seat of expiredSeats) {
					removeSeat(seat.key);
				}
				// notify the user
				alert('Some of your selected seats have expired and been released.');
			}
		} catch (error) {
			console.error('Error updating seat statuses:', error);
		}
	}

	// Update the helper functions
	function getCategoryColor(categoryName: string | undefined): string {
		const categoryKey = (categoryName?.toLowerCase() || 'regular') as CategoryType;
		return seatCategories[categoryKey]?.background || seatCategories.regular.background;
	}

	function getCategoryTextColor(categoryName: string | undefined): string {
		const categoryKey = (categoryName?.toLowerCase() || 'regular') as CategoryType;
		return seatCategories[categoryKey]?.text || seatCategories.regular.text;
	}

	onMount(async () => {
		// Initial status check
		await updateSeatStatuses();

		// Regular polling
		statusUpdateInterval = setInterval(updateSeatStatuses, 1000);

		// Check cart for existing tickets for this screening only
		const cartItems = cart.getItems();
		const existingCartSeats = cartItems
			.filter((item) => item.screeningId === screening.id)
			.flatMap((item) =>
				item.tickets.map((ticket) => ({
					key: `${ticket.row - 1}-${ticket.col - 1}`,
					row: ticket.row,
					col: ticket.col,
					label: ticket.label,
					seatId: ticket.seatId,
					price: ticket.price,
					categoryName: ticket.categoryName
				}))
			);

		// Check both general stored seats and screening-specific stored seats
		const storedSeats = localStorage.getItem('selectedSeats');
		const screeningSpecificSeats = localStorage.getItem(`selectedSeats_${screening.id}`);

		// Parse and filter general stored seats
		const storedSeatsArray = storedSeats
			? JSON.parse(storedSeats).filter(
					(seat: { screeningId: number }) => seat.screeningId === screening.id
				)
			: [];

		// Parse screening-specific stored seats
		const screeningSpecificSeatsArray = screeningSpecificSeats
			? JSON.parse(screeningSpecificSeats)
			: [];

		// Combine all seats (cart seats and both types of stored seats)
		const seatsToRestore = [
			...existingCartSeats,
			...storedSeatsArray,
			...screeningSpecificSeatsArray
		];

		// Re-lock each seat
		for (const seat of seatsToRestore) {
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

		// Clear both types of stored seats after retrieving them
		localStorage.removeItem('selectedSeats');
		localStorage.removeItem(`selectedSeats_${screening.id}`);
	});

	onDestroy(() => {
		if (statusUpdateInterval) clearInterval(statusUpdateInterval);
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
		if (!$page.data.session) {
			pendingSeatSelection = { rowIndex, colIndex, seat };
			showLoginModal = true;
			return;
		}
		if (!seat || loading || seat.status === 'inactive') return;

		const seatStatus = seatStatuses.get(seat.id);
		// Block if seat is booked or locked by someone else
		if (
			seatStatus?.is_booked ||
			(seatStatus?.is_locked && seatStatus.locked_by !== $page.data.session?.user?.id)
		) {
			return;
		}

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
			await updateSeatStatuses();
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

	async function handleCheckout() {
		if (loading) return;
		loading = true;

		try {
			// Get current cart items
			const cartItems = cart.getItems();
			const existingSeats = cartItems
				.filter((item) => item.screeningId === screening.id)
				.flatMap((item) => item.tickets)
				.map((ticket) => ticket.seatId);

			// Find which seats are new and which are already in cart
			const seatsToAdd = selectedSeats.filter((seat) => !existingSeats.includes(seat.seatId));
			const existingSelectedSeats = selectedSeats.filter((seat) =>
				existingSeats.includes(seat.seatId)
			);

			// If we have any new seats to add, add them to cart
			if (seatsToAdd.length > 0) {
				// Store selected seats in localStorage as backup
				localStorage.setItem('selectedSeats', JSON.stringify(seatsToAdd));

				// Add new seats to cart
				cart.addItem({
					screeningId: screening.id,
					movieId: movie.imdb_id,
					movieTitle: movie.title,
					screeningTime: screening.start_time,
					tickets: seatsToAdd.map((seat) => ({
						seatId: seat.seatId,
						row: seat.row,
						col: seat.col,
						label: seat.label,
						price: seat.price,
						categoryName: seat.categoryName
					})),
					movieImageUrl: movie.poster_url || '/fallback-movie-poster.jpg'
				});
			}

			// Navigate to cart regardless of whether we added new seats or not
			window.location.href = '/cart';
		} catch (error) {
			console.error('Add to cart error:', error);
			alert('Failed to add tickets to cart. Please try again.');
		} finally {
			loading = false;
		}
	}

	function formatDateTime(dateString: string) {
		return new Date(dateString).toLocaleString();
	}

	function formatPrice(price: string | number): string {
		const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
		if (isNaN(numericPrice)) return '0.00';
		return numericPrice.toFixed(2);
	}
</script>

<main>
	{#if !error}
		<div class="container">
			<button class="back-button" on:click={goBackToMovie}>
				<Icon icon="mdi:arrow-left" width="20" height="20" />
				{$t('movies_id.backToMovie')}
			</button>
			<h1 class="movie-title">{movie.title}</h1>
			<p class="showtime-info">
				{$t('movies_id.showtime')}
				{formatDateTime(screening.start_time)}
			</p>

			<div class="booking-container">
				<!-- Left side - Seating Plan -->
				<div class="seating-section">
					<div class="screen-container">
						<div class="screen"></div>
						<p class="screen-label">{$t('movies_id.screenLabel')}</p>
					</div>

					<div class="seat-plan">
						{#each screening.hall.seatPlan as row, rowIndex}
							<div class="seat-row">
								<div class="row-label">{String.fromCharCode(65 + rowIndex)}</div>
								{#each row.filter((seat) => seat !== null) as seat}
									<button
										class="seat-button"
										class:seat-selected={selectedSeats.some(
											(s) => s.row === rowIndex + 1 && s.col === seat.column_number
										)}
										class:seat-booked={seatStatuses.get(seat?.id)?.is_booked}
										class:seat-locked={!seatStatuses.get(seat?.id)?.is_booked &&
											seatStatuses.get(seat?.id)?.is_locked &&
											seatStatuses.get(seat?.id)?.locked_by !== $page.data.session?.user?.id}
										class:seat-inactive={seat?.status === 'inactive'}
										style={seat
											? `background-color: ${
													selectedSeats.some(
														(s) => s.row === rowIndex + 1 && s.col === seat.column_number
													)
														? '#3b82f6'
														: seatStatuses.get(seat.id)?.is_booked
															? '#6b7280'
															: seatStatuses.get(seat.id)?.is_locked &&
																  seatStatuses.get(seat.id)?.locked_by !==
																		$page.data.session?.user?.id
																? '#9ca3af'
																: getCategoryColor(seat.category?.name)
												};
											   opacity: ${
														seatStatuses.get(seat.id)?.is_locked &&
														seatStatuses.get(seat.id)?.locked_by !== $page.data.session?.user?.id
															? '0.6'
															: '1'
													};
											   color: ${
														selectedSeats.some(
															(s) => s.row === rowIndex + 1 && s.col === seat.column_number
														)
															? '#ffffff'
															: getCategoryTextColor(seat.category?.name)
													}`
											: ''}
										disabled={!seat ||
											seatStatuses.get(seat?.id)?.is_booked ||
											seat.status === 'inactive' ||
											(seatStatuses.get(seat?.id)?.is_locked &&
												seatStatuses.get(seat?.id)?.locked_by !== $page.data.session?.user?.id)}
										on:click={() => handleSeatClick(rowIndex, seat.column_number - 1, seat)}
									>
										{seat?.seat_label ?? ''}
									</button>
								{/each}
							</div>
						{/each}
					</div>

					<div class="seat-legend">
						<div class="legend-section">
							<span class="legend-section-title">
								{$t('movies_id.seatCategories')}
							</span>
							{#each Object.entries(seatCategories) as [type, data]}
								<div class="legend-item">
									<div class="legend-box" style="background-color: {getCategoryColor(type)}"></div>
									<span>{$t(`movies_id.seatTypes.${type.toLowerCase()}`)}</span>
								</div>
							{/each}
						</div>
						<div class="legend-section">
							<span class="legend-section-title">
								{$t('movies_id.seatStatus')}
							</span>
							<div class="legend-item">
								<div class="legend-box selected"></div>
								<span>{$t('movies_id.selected')}</span>
							</div>
							<div class="legend-item">
								<div class="legend-box booked"></div>
								<span>{$t('movies_id.booked')}</span>
							</div>
							<div class="legend-item">
								<div class="legend-box locked"></div>
								<span>{$t('movies_id.locked')}</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Right side - Cart -->
				<div class="cart-section">
					<div class="cart-container">
						<h2 class="cart-title">{$t('movies_id.selectedTickets')}</h2>

						<div class="tickets-container">
							{#if selectedSeats.length === 0}
								<p class="no-tickets">
									{$t('movies_id.noSeatsSelected')}
								</p>
							{:else}
								{#each selectedSeats as seat (seat.key)}
									<div class="ticket-item">
										<div class="ticket-info">
											<p class="seat-label">
												{$t('movies_id.seat')}
												{seat.label} ({$t(
													`movies_id.seatTypes.${seat.categoryName.toLowerCase()}`
												)})
											</p>
											<p class="seat-details">
												{$t('movies_id.row')}
												{seat.row},
												{$t('movies_id.column')}
												{seat.col}
											</p>
											<p class="ticket-price">
												${formatPrice(seat.price)}
											</p>
										</div>
										<button
											class="remove-button"
											on:click={() => removeSeat(seat.key)}
											aria-label={$t('movies_id.removeTicket')}
										>
											×
										</button>
									</div>
								{/each}
							{/if}
						</div>

						<div class="cart-footer">
							<div class="total-price">
								<span>{$t('movies_id.total')}</span>
								<span>${formatPrice(totalPrice)}</span>
							</div>

							<button
								class="checkout-button"
								disabled={selectedSeats.length === 0}
								on:click={handleCheckout}
							>
								{$t('movies_id.addToCart')}
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

	{#if showLoginModal}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="modal-overlay" on:click|self={() => (showLoginModal = false)}>
			<div class="modal-content">
				<div class="empty-content">
					<Icon icon="mdi:account-lock" width="64" height="64" />
					<h2>{$t('movies_id.authenticationRequired')}</h2>
					<p>{$t('movies_id.pleaseLogIn')}</p>
					<button class="auth-button" on:click={goToLogin}>
						{$t('movies_id.goToLogin')}
					</button>
				</div>
			</div>
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
		position: relative;
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
		justify-content: space-between;
	}

	.seating-section {
		flex: 3;
		background: white;
		padding: 2rem;
		border-radius: 1rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.cart-section {
		flex: 2;
		position: sticky;
		top: 2rem;
		min-width: 350px;
	}

	.screen-container {
		margin-bottom: 3rem;
		text-align: center;
		padding-left: 2.5rem;
	}

	.screen {
		height: 8px;
		background: linear-gradient(to right, #e2e8f0, #94a3b8, #e2e8f0);
		margin: 0 auto 1rem;
		width: calc(100% - 2.5rem);
		border-radius: 4px;
	}

	.screen-label {
		font-size: 0.875rem;
		color: #666;
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

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.modal-content {
		background: white;
		padding: 2rem;
		border-radius: 1rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		max-width: 400px;
		width: 90%;
	}

	.empty-content {
		text-align: center;
	}

	.empty-content :global(svg) {
		color: #6b7280;
		margin-bottom: 1.5rem;
	}

	.empty-content h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1a1a1a;
		margin-bottom: 0.75rem;
	}

	.empty-content p {
		color: #666;
		margin-bottom: 1.5rem;
	}

	.auth-button {
		padding: 0.75rem 1.5rem;
		background-color: transparent;
		color: #2563eb;
		border: 2px solid #2563eb;
		border-radius: 0.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		margin: 0 auto;
	}

	.auth-button:hover {
		background-color: rgba(37, 99, 235, 0.1);
	}

	@media (max-width: 640px) {
		.modal-content {
			margin: 0 1rem;
			padding: 1.5rem;
		}
	}

	.seat-button {
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

	.seat-button:not(:disabled):hover {
		transform: scale(1.1);
	}

	.seat-selected {
		background-color: #3b82f6 !important;
		color: white !important;
	}

	.seat-booked {
		background-color: #6b7280 !important;
		cursor: not-allowed;
		opacity: 0.8;
	}

	.seat-locked {
		background-color: #9ca3af !important;
		cursor: not-allowed;
		opacity: 0.6;
		border: 1px solid #6b7280;
	}

	.seat-inactive {
		background-color: #9ca3af !important;
		cursor: not-allowed;
		opacity: 0.5;
	}

	.seat-legend {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px solid #e5e7eb;
	}

	.legend-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.legend-section-title {
		font-size: 0.875rem;
		color: #666;
		font-weight: 500;
		margin-bottom: 0.25rem;
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
		color: white;
	}

	.legend-box.booked {
		background-color: #6b7280;
		opacity: 0.8;
	}

	.legend-box.locked {
		background-color: #9ca3af;
		opacity: 0.6;
		border: 1px solid #6b7280;
	}

	.cart-container {
		background: white;
		padding: 2rem;
		border-radius: 1rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		display: flex;
		flex-direction: column;
		height: calc(100vh - 8rem);
		max-height: 800px;
		width: 100%;
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
		padding: 1.25rem;
		background-color: #f8f9fa;
		border-radius: 0.75rem;
		margin-bottom: 1rem;
		transition: transform 0.2s ease;
	}

	.ticket-item:hover {
		transform: translateX(4px);
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
		width: 100%;
		padding: 0.875rem;
		border: none;
		border-radius: 0.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		background-color: #2563eb;
		color: white;
	}

	.checkout-button:hover:not(:disabled) {
		background-color: #1d4ed8;
	}

	.checkout-button:disabled {
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
		.seating-section,
		.cart-section {
			width: 100%;
			flex: none;
		}

		.cart-section {
			position: static;
			margin-top: 2rem;
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

		.movie-title {
			font-size: 1.5rem;
		}
	}
</style>
