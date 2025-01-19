<script lang="ts">
	import type { PageData } from './$types';
	import Icon from '@iconify/svelte';
	import { cart } from '$lib/stores/cart';
	import { formatDateTime, formatPrice } from '$lib/utils';
	import type { CartTicket } from '$lib/types';

	let loading = false;

	// Constants
	const BOOKING_FEE = 2.0; // Fixed booking fee per order

	// Calculate totals
	$: subtotal = $cart.reduce(
		(sum, item) => sum + item.tickets.reduce((ticketSum, ticket) => ticketSum + ticket.price, 0),
		0
	);
	$: bookingFee = $cart.length > 0 ? BOOKING_FEE : 0;
	$: total = subtotal + bookingFee;

	function getTicketLabels(tickets: CartTicket[]): string {
		return tickets.map((t) => `${t.label} (${t.categoryName})`).join(', ');
	}

	async function proceedToCheckout() {
		if (loading || $cart.length === 0) return;

		loading = true;
		try {
			// Process each screening in cart
			for (const cartItem of $cart) {
				const response = await fetch('/api/checkout', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						screeningId: cartItem.screeningId,
						seats: cartItem.tickets.map((ticket) => ({
							seatId: ticket.seatId,
							price: ticket.price
						}))
					})
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || 'Checkout failed');
				}

				const { checkoutUrl } = await response.json();
				// Clear cart after successful checkout
				cart.clear();
				// Redirect to payment
				window.location.href = checkoutUrl;
				return;
			}
		} catch (error) {
			console.error('Checkout error:', error);
			alert(
				error instanceof Error ? error.message : 'Failed to process checkout. Please try again.'
			);
		} finally {
			loading = false;
		}
	}
</script>

// src/routes/cart/+page.svelte
<main>
	<div class="container">
		<h1 class="page-title">Shopping Cart</h1>

		<div class="cart-layout">
			<!-- Cart Items -->
			<div class="cart-items">
				{#if $cart.length === 0}
					<div class="empty-cart">
						<p>Your cart is empty</p>
						<a href="/movies" class="browse-movies">Browse Movies</a>
					</div>
				{:else}
					{#each $cart as item}
						<div class="cart-item">
							<img
								src={item.movieImageUrl || '/fallback-movie-poster.jpg'}
								alt={item.movieTitle}
								class="movie-poster"
							/>
							<div class="item-details">
								<h3 class="movie-title">{item.movieTitle}</h3>
								<p class="screening-time">
									Screening: {formatDateTime(item.screeningTime)}
								</p>
								<p class="seat-info">
									Seats: {getTicketLabels(item.tickets)}
								</p>
								<div class="tickets-summary">
									{#each item.tickets as ticket}
										<div class="ticket-row">
											<span>{ticket.label} ({ticket.categoryName})</span>
											<span>${formatPrice(ticket.price)}</span>
										</div>
									{/each}
								</div>
								<div class="item-actions">
									<span class="price">
										Total: ${formatPrice(item.tickets.reduce((sum, t) => sum + t.price, 0))}
									</span>
									<button class="remove-button" on:click={() => cart.removeItem(item.screeningId)}>
										Remove
									</button>
								</div>
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<!-- Order Summary -->
			<div class="order-summary">
				<div class="summary-container">
					<h2 class="summary-title">Order Summary</h2>

					<div class="summary-details">
						<div class="summary-row">
							<span>Subtotal</span>
							<span>${formatPrice(subtotal)}</span>
						</div>
						{#if bookingFee > 0}
							<div class="summary-row">
								<span>Booking Fee</span>
								<span>${formatPrice(bookingFee)}</span>
							</div>
						{/if}
					</div>

					<div class="total-row">
						<span>Total</span>
						<span>${formatPrice(total)}</span>
					</div>

					<button
						class="checkout-button"
						disabled={$cart.length === 0 || loading}
						on:click={proceedToCheckout}
					>
						{#if loading}
							<span class="loading-spinner"></span>
						{/if}
						Proceed to Checkout
					</button>
				</div>
			</div>
		</div>
	</div>
</main>

<style>
	/* Your existing styles... */

	.browse-movies {
		display: inline-block;
		margin-top: 1rem;
		color: #2563eb;
		text-decoration: none;
		font-weight: 500;
	}

	.browse-movies:hover {
		text-decoration: underline;
	}

	.tickets-summary {
		margin: 0.5rem 0;
		padding: 0.5rem 0;
		border-top: 1px solid #e5e7eb;
		border-bottom: 1px solid #e5e7eb;
	}

	.ticket-row {
		display: flex;
		justify-content: space-between;
		color: #4b5563;
		font-size: 0.875rem;
		padding: 0.25rem 0;
	}

	.loading-spinner {
		display: inline-block;
		width: 1rem;
		height: 1rem;
		border: 2px solid #ffffff;
		border-radius: 50%;
		border-top-color: transparent;
		animation: spin 1s linear infinite;
		margin-right: 0.5rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
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

	.page-title {
		font-size: 2rem;
		font-weight: 600;
		color: #1a1a1a;
		margin-bottom: 2rem;
		text-align: center;
	}

	.cart-layout {
		display: flex;
		gap: 2rem;
		align-items: flex-start;
	}

	.cart-items {
		flex: 3;
	}

	.empty-cart {
		background: white;
		padding: 2rem;
		text-align: center;
		color: #6b7280;
		border-radius: 1rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.cart-item {
		background: white;
		padding: 1rem;
		border-radius: 1rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
		transition: all 0.2s ease;
	}

	.cart-item:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 8px rgba(0, 0, 0, 0.1);
	}

	.cart-item:hover .movie-poster {
		transform: scale(1.02);
	}

	.movie-poster {
		width: 120px;
		height: 180px;
		object-fit: cover;
		border-radius: 0.5rem;
		transition: transform 0.3s ease;
	}

	.item-details {
		flex-grow: 1;
	}

	.movie-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1a1a1a;
		margin-bottom: 0.5rem;
	}

	.screening-time,
	.seat-info {
		color: #6b7280;
		margin-bottom: 0.5rem;
	}

	.item-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 1rem;
	}

	.price {
		color: #2563eb;
		font-weight: 600;
	}

	.remove-button {
		color: #ef4444;
		font-weight: 500;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 0.375rem;
		transition: all 0.2s;
	}

	.remove-button:hover {
		background-color: #fee2e2;
	}

	.order-summary {
		flex: 2;
		position: sticky;
		top: 6rem;
	}

	.summary-container {
		background: white;
		padding: 1.5rem;
		border-radius: 1rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.summary-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.summary-details {
		margin-bottom: 1.5rem;
	}

	.summary-row {
		display: flex;
		justify-content: space-between;
		color: #4b5563;
		margin-bottom: 0.75rem;
	}

	.total-row {
		display: flex;
		justify-content: space-between;
		font-weight: 600;
		font-size: 1.25rem;
		padding-top: 1rem;
		border-top: 1px solid #e5e7eb;
		margin-bottom: 1.5rem;
	}

	.checkout-button {
		width: 100%;
		padding: 0.875rem;
		background-color: #2563eb;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.checkout-button:hover:not(:disabled) {
		background-color: #1d4ed8;
	}

	.checkout-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 1024px) {
		.cart-layout {
			flex-direction: column;
		}

		.order-summary {
			position: static;
			width: 100%;
		}
	}

	@media (max-width: 640px) {
		.cart-item {
			flex-direction: column;
		}

		.movie-poster {
			width: 100%;
			height: 200px;
		}
	}
</style>
