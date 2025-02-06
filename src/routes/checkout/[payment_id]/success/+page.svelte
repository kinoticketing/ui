<script lang="ts">
	import { generateTicketQRCode, type TicketInfo } from '$lib/utils/qrCode';
	import type { PageData } from './$types';
	import Icon from '@iconify/svelte';
	import '../../../../i18n.js';
	import { t } from 'svelte-i18n';

	export let data: PageData;
	const { payment } = data;

	function formatDateTime(date: string) {
		return new Date(date).toLocaleString();
	}

	function formatPrice(price: string | number) {
		return typeof price === 'string' ? parseFloat(price).toFixed(2) : price.toFixed(2);
	}

	function createTicketInfo(
		ticket: { ticket_code: string; seat_label: string },
		screeningTime: string
	): TicketInfo {
		return {
			showtime: screeningTime,
			seats: [ticket.seat_label],
			uniqueIdentifier: ticket.ticket_code
		};
	}
</script>

<main>
	<div class="container">
		<h1 class="page-title">{$t('payment_successful.paymentSuccessful')}</h1>

		<div class="success-content">
			<div class="success-header">
				<div class="success-icon">
					<Icon icon="mdi:check-circle" class="text-green-500 w-16 h-16" />
				</div>
				<p class="confirmation-text">{$t('payment_successful.thankYou')}</p>
				<div class="total-amount">
					<span class="label">{$t('payment_successful.totalAmountPaid')}</span>
					<span class="value">${formatPrice(payment.amount)}</span>
				</div>
			</div>

			{#each payment.screenings as screening}
				<div class="screening-details">
					<div class="details-header">
						<h2>{screening.movie_title}</h2>
						<p class="screening-time">
							{$t('payment_successful.screeningLabel')}
							{formatDateTime(screening.screening_time)}
						</p>
					</div>

					<div class="tickets-grid">
						{#each screening.tickets as ticket}
							<div class="ticket-item">
								<div class="ticket-content">
									<div class="seat-info">
										<span class="seat-label">
											{$t('payment_successful.seatLabel')}
											{ticket.seat_label}
										</span>
									</div>
									<div class="ticket-code">
										{$t('payment_successful.codeLabel')}
										{ticket.ticket_code}
									</div>

									{#await generateTicketQRCode(createTicketInfo(ticket, screening.screening_time))}
										<p>{$t('payment_successful.generatingQrCode')}</p>
									{:then qrCodeDataUrl}
										<img src={qrCodeDataUrl} alt="Ticket QR Code" class="qr-code" />
									{:catch error}
										<p>
											{$t('payment_successful.errorGeneratingQrCode')}
											{error.message}
										</p>
									{/await}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/each}

			<div class="actions">
				<a href="/" class="home-button">
					{$t('payment_successful.returnToHome')}
				</a>
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

	.success-content {
		background: white;
		border-radius: 1rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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

	.confirmation-text {
		color: #4b5563;
		font-size: 1.125rem;
		margin-bottom: 1rem;
	}

	.total-amount {
		background-color: #f3f4f6;
		padding: 1rem;
		border-radius: 0.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-weight: 600;
	}

	.screening-details {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 1rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.details-header {
		margin-bottom: 1.5rem;
	}

	.details-header h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1a1a1a;
		margin-bottom: 0.5rem;
	}

	.screening-time {
		color: #6b7280;
	}

	.tickets-grid {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	}

	.ticket-item {
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		transition: transform 0.2s ease;
	}

	.ticket-item:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
	}

	.ticket-content {
		padding: 1rem;
	}

	.seat-info {
		margin-bottom: 0.75rem;
	}

	.seat-label {
		font-weight: 600;
		color: #1a1a1a;
	}

	.ticket-code {
		font-family: monospace;
		color: #4b5563;
		margin-bottom: 1rem;
		padding: 0.5rem;
		background: #f3f4f6;
		border-radius: 0.25rem;
	}

	.qr-code {
		width: 150px;
		height: 150px;
		margin: 0 auto;
		display: block;
	}

	.actions {
		margin-top: 2rem;
		text-align: center;
	}

	.home-button {
		display: inline-block;
		background-color: #2563eb;
		color: white;
		padding: 0.875rem 1.5rem;
		border-radius: 0.5rem;
		font-weight: 500;
		text-decoration: none;
		transition: background-color 0.2s;
	}

	.home-button:hover {
		background-color: #1d4ed8;
	}

	@media (max-width: 640px) {
		.tickets-grid {
			grid-template-columns: 1fr;
		}

		.screening-details {
			padding: 1rem;
		}
	}
</style>
