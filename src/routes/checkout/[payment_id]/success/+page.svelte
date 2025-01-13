<script lang="ts">
	import type { PageData } from './$types';
	import Icon from '@iconify/svelte';

	export let data: PageData;
	const { payment } = data;

	function formatDateTime(date: string) {
		return new Date(date).toLocaleString();
	}

	function formatPrice(price: string | number) {
		return typeof price === 'string' ? parseFloat(price).toFixed(2) : price.toFixed(2);
	}
</script>

<main>
	<div class="container">
		<div class="success-content">
			<div class="success-header">
				<div class="success-icon">
					<Icon icon="mdi:check-circle" class="text-green-500 w-16 h-16" />
				</div>
				<h1>Payment Successful!</h1>
				<p class="confirmation-text">Thank you for your purchase</p>
			</div>

			<div class="booking-details">
				<h2>Booking Details</h2>
				<div class="details-grid">
					<div class="detail-item">
						<span class="label">Movie:</span>
						<span class="value">{payment.movie_title}</span>
					</div>
					<div class="detail-item">
						<span class="label">Screening:</span>
						<span class="value">{formatDateTime(payment.screening_time)}</span>
					</div>
					<div class="detail-item">
						<span class="label">Amount Paid:</span>
						<span class="value">${formatPrice(payment.amount)}</span>
					</div>
				</div>

				<div class="tickets-section">
					<h3>Your Tickets</h3>
					<div class="tickets-grid">
						{#each payment.tickets as ticket}
							<div class="ticket-item">
								<div class="seat-info">
									<span class="seat-label">Seat {ticket.seat_label}</span>
								</div>
								<div class="ticket-code">
									Code: {ticket.ticket_code}
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<div class="actions">
				<a href="/" class="home-button">Return to Home</a>
			</div>
		</div>
	</div>
</main>

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	.success-content {
		background: white;
		border-radius: 0.5rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		padding: 2rem;
	}

	.success-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.success-icon {
		margin-bottom: 1rem;
		display: flex;
		justify-content: center;
	}

	h1 {
		font-size: 1.875rem;
		font-weight: 600;
		color: #16a34a;
		margin-bottom: 0.5rem;
	}

	.confirmation-text {
		color: #4b5563;
		font-size: 1.125rem;
	}

	.booking-details {
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 1px solid #e5e7eb;
	}

	h2 {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
	}

	.details-grid {
		display: grid;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.detail-item {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem 0;
	}

	.label {
		color: #6b7280;
		font-weight: 500;
	}

	.value {
		font-weight: 600;
	}

	.tickets-section {
		margin-top: 2rem;
	}

	h3 {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 1rem;
	}

	.tickets-grid {
		display: grid;
		gap: 1rem;
	}

	.ticket-item {
		background: #f9fafb;
		padding: 1rem;
		border-radius: 0.375rem;
		border: 1px solid #e5e7eb;
	}

	.seat-info {
		margin-bottom: 0.5rem;
	}

	.seat-label {
		font-weight: 600;
	}

	.ticket-code {
		font-family: monospace;
		color: #4b5563;
	}

	.actions {
		margin-top: 2rem;
		text-align: center;
	}

	.home-button {
		display: inline-block;
		background-color: #2563eb;
		color: white;
		padding: 0.75rem 1.5rem;
		border-radius: 0.375rem;
		font-weight: 500;
		text-decoration: none;
		transition: background-color 0.2s;
	}

	.home-button:hover {
		background-color: #1d4ed8;
	}
</style>
