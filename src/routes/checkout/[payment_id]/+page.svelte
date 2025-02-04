<!-- src/routes/checkout/[payment_id]/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './types';
	import Icon from '@iconify/svelte';
	import { PUBLIC_PAYPAL_CLIENT_ID } from '$env/static/public';
	import '../../../i18n.js';
	import { t } from 'svelte-i18n';

	export let data: PageData;
	const { payment, tickets, movie, screening } = data;

	// ... other imports

	let error = '';
	let loading = false;

	async function initializePayPalButtons() {
		try {
			await window.paypal
				.Buttons({
					style: {
						layout: 'vertical',
						color: 'blue',
						shape: 'rect',
						label: 'pay'
					},
					createOrder: async () => {
						loading = true;
						error = '';

						try {
							const response = await fetch(`/api/payments/${payment.id}/paypal/create`, {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({
									amount: payment.amount
								})
							});

							if (!response.ok) {
								const errorData = await response.json();
								// Use translation key if server doesn't provide a custom error
								throw new Error(errorData.error || $t('checkout.failCreatePayPalOrder'));
							}

							const orderData = await response.json();
							return orderData.id;
						} catch (err) {
							error = $t('checkout.failCreateOrderPleaseTry');
							console.error($t('checkout.errorCreatingOrderPrefix'), err);
							throw err;
						} finally {
							loading = false;
						}
					},
					onApprove: async (data: { orderID: string }) => {
						loading = true;
						error = '';

						try {
							const response = await fetch(`/api/payments/${payment.id}/paypal/capture`, {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({
									orderId: data.orderID
								})
							});

							if (!response.ok) {
								const errorData = await response.json();
								throw new Error(errorData.error || $t('checkout.paymentCaptureFailed'));
							}

							window.location.href = `/checkout/${payment.id}/success`;
						} catch (err) {
							error = $t('checkout.paymentFailedPleaseTry');
							console.error($t('checkout.errorCreatingOrderPrefix'), err);
						} finally {
							loading = false;
						}
					},
					onError: (err: Error) => {
						error = $t('checkout.paymentSystemErrorTryAgain');
						console.error($t('checkout.paypalInitializationErrorPrefix'), err);
						loading = false;
					},
					onCancel: () => {
						error = '';
						loading = false;
					}
				})
				.render('#paypal-button-container');
		} catch (err) {
			error = $t('checkout.failInitPayPalRefresh');
			console.error($t('checkout.paypalInitializationErrorPrefix'), err);
		}
	}
	let timeLeft = 900; // 15 minutes in seconds
	let timer: ReturnType<typeof setInterval>;

	onMount(async () => {
		try {
			const script = document.createElement('script');
			script.src = `https://www.paypal.com/sdk/js?client-id=${PUBLIC_PAYPAL_CLIENT_ID}&currency=EUR`;
			script.async = true;

			await new Promise<void>((resolve, reject) => {
				script.onload = () => resolve();
				script.onerror = () => reject(new Error($t('checkout.failLoadPayPalSdk')));
				document.body.appendChild(script);
			});

			await initializePayPalButtons();
		} catch (err) {
			console.error($t('checkout.paypalInitializationErrorPrefix'), err);
			error = $t('checkout.failLoadPaymentSystemRefresh');
		}
	});

	$: minutes = Math.floor(timeLeft / 60);
	$: seconds = timeLeft % 60;

	function formatDateTime(date: string) {
		return new Date(date).toLocaleString();
	}

	function formatPrice(price: number) {
		return price.toFixed(2);
	}

	function goBackToBooking() {
		// Store current tickets in localStorage before navigating back
		const selectedSeats = tickets.map((ticket) => ({
			key: `${ticket.row - 1}-${ticket.column - 1}`,
			row: ticket.row,
			col: ticket.column,
			label: ticket.seat_label,
			seatId: ticket.id,
			price: ticket.price
		}));

		localStorage.setItem('selectedSeats', JSON.stringify(selectedSeats));
		window.location.href = `/movies/${movie.imdb_id}/${screening.id}`;
	}

	// Countdown timer
</script>

<main>
	<div class="container">
		<button class="back-button" on:click={goBackToBooking}>
			<Icon icon="mdi:arrow-left" width="20" height="20" />
			{$t('checkout.backToBooking')}
		</button>

		<h1 class="movie-title">{movie.title}</h1>
		<p class="showtime-info">
			{$t('checkout.showtime')}
			{formatDateTime(screening.start_time)}
		</p>

		<div class="timer-container">
			<p class="timer-text">
				{$t('checkout.reservedSeats')}
				{minutes}:{seconds.toString().padStart(2, '0')}
			</p>
		</div>

		<div class="checkout-container">
			<!-- Order Summary -->
			<div class="summary-section">
				<div class="summary-container">
					<h2 class="summary-title">{$t('checkout.orderSummary')}</h2>

					<div class="tickets-container">
						{#each tickets as ticket}
							<div class="ticket-item">
								<div class="ticket-info">
									<p class="seat-label">
										{$t('checkout.seat')}
										{ticket.seat_label}
									</p>
									<p class="seat-details">
										{$t('checkout.row')}
										{ticket.row}, {$t('checkout.column')}
										{ticket.column}
									</p>
									<p class="ticket-price">${formatPrice(ticket.price)}</p>
								</div>
							</div>
						{/each}
					</div>

					<div class="summary-footer">
						<div class="total-price">
							<span>{$t('checkout.total')}</span>
							<span>${formatPrice(payment.amount)}</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Payment Method -->
			<div class="payment-section">
				<div class="payment-container">
					<h2 class="payment-title">{$t('checkout.paymentMethod')}</h2>

					{#if error}
						<div class="error-message">
							{error}
						</div>
					{/if}

					<div id="paypal-button-container"></div>
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
		margin-bottom: 1rem;
	}

	.timer-container {
		background-color: #fff3cd;
		border: 1px solid #ffeeba;
		padding: 1rem;
		margin-bottom: 2rem;
		border-radius: 0.5rem;
		text-align: center;
		max-width: 400px;
		margin-left: auto;
		margin-right: auto;
	}

	.timer-text {
		color: #856404;
	}

	.checkout-container {
		display: flex;
		gap: 2rem;
		align-items: flex-start;
	}

	.summary-section {
		flex: 3;
		background: white;
		padding: 2rem;
		border-radius: 1rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.summary-container {
		display: flex;
		flex-direction: column;
		min-height: 400px;
	}

	.summary-title {
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

	.summary-footer {
		border-top: 1px solid #e5e7eb;
		padding-top: 1.5rem;
		margin-top: auto;
	}

	.total-price {
		display: flex;
		justify-content: space-between;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.payment-section {
		flex: 2;
		position: sticky;
		top: 2rem;
	}

	.payment-container {
		background: white;
		padding: 1.5rem;
		border-radius: 1rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.payment-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.error-message {
		background-color: #fee2e2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1.5rem;
	}

	#paypal-button-container {
		width: 100%;
		min-height: 150px;
	}

	@media (max-width: 1024px) {
		.checkout-container {
			flex-direction: column;
		}

		.payment-section {
			position: static;
			width: 100%;
		}

		.summary-section {
			width: 100%;
		}

		.summary-container {
			min-height: auto;
		}
	}

	@media (max-width: 640px) {
		.movie-title {
			font-size: 1.5rem;
		}

		.summary-title,
		.payment-title {
			font-size: 1.25rem;
		}
	}
</style>
