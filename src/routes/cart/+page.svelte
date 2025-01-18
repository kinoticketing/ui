<script lang="ts">
	import type { PageData } from './$types';
	import Icon from '@iconify/svelte';
	import { cart } from '$lib/stores/cart';

	export let data: PageData;
	let loading = false;

	function removeFromCart(id: number) {
		cart.removeItem(id);
	}

	async function proceedToCheckout() {
		if (loading) return;

		loading = true;
		try {
			// Process all items in cart
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
					const error = await response.json();
					throw new Error(error.error || 'Checkout failed');
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
			alert('Failed to process checkout. Please try again.');
		} finally {
			loading = false;
		}
	}

	//$: total = data.cartItems.reduce((sum, item) => sum + item.price, 0);
	//$: bookingFee = data.cartItems.length > 0 ? 2.0 : 0;
	let total = 10;
	let bookingFee = 5;
</script>

<main>
	<div class="container">
		<h1 class="page-title">Shopping Cart</h1>

		<div class="cart-layout">
			<!-- Cart Items -->
			<div class="cart-items">
				{#if $cart.length === 0}
					<div class="empty-cart">
						<p>Your cart is empty</p>
					</div>
				{:else}
					{#each $cart as item}
						<div class="cart-item">
							<img src={item.movieImageUrl} alt={item.movieTitle} class="movie-poster" />
							<div class="item-details">
								<h3 class="movie-title">{item.movieTitle}</h3>
								<p class="screening-time">{item.screeningTime}</p>
								<p class="seat-info">Seats: {item.tickets}</p>
								<div class="item-actions">
									<span class="price">${item.tickets[0].price.toFixed(2)}</span>
									<button class="remove-button" on:click={() => removeFromCart(item.screeningId)}>
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
							<span>${total.toFixed(2)}</span>
						</div>
						<div class="summary-row">
							<span>Booking Fee</span>
							<span>${bookingFee.toFixed(2)}</span>
						</div>
					</div>

					<div class="total-row">
						<span>Total</span>
						<span>${(total + bookingFee).toFixed(2)}</span>
					</div>

					<button
						class="checkout-button"
						disabled={data.cartItems.length === 0}
						on:click={proceedToCheckout}
					>
						Proceed to Checkout
					</button>
				</div>
			</div>
		</div>
	</div>
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
	}

	.movie-poster {
		width: 120px;
		height: 180px;
		object-fit: cover;
		border-radius: 0.5rem;
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
