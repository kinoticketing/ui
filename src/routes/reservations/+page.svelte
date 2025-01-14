<!-- src/routes/reservations/+page.svelte -->
<script lang="ts">
	import Icon from '@iconify/svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	interface Ticket {
		id: string;
		ticket_code: string;
		status: string;
		movie_title: string;
		screening_time: string;
		seat_label: string;
		hall_name: string;
		price: number;
		booking_date: string;
	}

	interface PageData {
		tickets?: Ticket[];
	}

	export let data: PageData;

	function formatDateTime(dateString: string) {
		return new Date(dateString).toLocaleString('de-DE', {
			weekday: 'short',
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatPrice(price: string | number) {
		return typeof price === 'string' ? parseFloat(price).toFixed(2) : price.toFixed(2);
	}

	function goToMovies() {
		goto('/movies');
	}

	function goToLogin() {
		goto('/auth/login');
	}
</script>

<main>
	<div class="container">
		{#if $page.data.session}
			<button class="back-button" on:click={() => goto('/')}>
				<Icon icon="mdi:arrow-left" width="20" height="20" />
				Back to Home
			</button>

			<h1 class="page-title">My Reservations</h1>

			{#if data.tickets && data.tickets.length > 0}
				<div class="tickets-grid">
					{#each data.tickets as ticket}
						<div class="ticket-card">
							<div class="ticket-header">
								<h2 class="movie-title">{ticket.movie_title}</h2>
								<p class="booking-date">Reserved on: {formatDateTime(ticket.booking_date)}</p>
							</div>

							<div class="ticket-details">
								<div class="detail-item">
									<span class="detail-label">Screening:</span>
									<span class="detail-value">{formatDateTime(ticket.screening_time)}</span>
								</div>

								<div class="detail-item">
									<span class="detail-label">Hall:</span>
									<span class="detail-value">{ticket.hall_name}</span>
								</div>

								<div class="detail-item">
									<span class="detail-label">Seat:</span>
									<span class="detail-value">{ticket.seat_label}</span>
								</div>

								<div class="detail-item">
									<span class="detail-label">Price:</span>
									<span class="detail-value">€{formatPrice(ticket.price)}</span>
								</div>

								<div class="detail-item">
									<span class="detail-label">Ticket Code:</span>
									<span class="detail-value code">{ticket.ticket_code}</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="empty-state">
					<div class="empty-content">
						<Icon icon="mdi:ticket-outline" width="64" height="64" />
						<h2>No Reservations Found</h2>
						<p>You haven't booked any movie tickets yet.</p>
						<button class="auth-button" on:click={goToMovies}> Browse Movies </button>
					</div>
				</div>
			{/if}
		{:else}
			<div class="empty-state">
				<div class="empty-content">
					<Icon icon="mdi:account-lock" width="64" height="64" />
					<h2>Authentication Required</h2>
					<p>Please log in to view your reservations.</p>
					<button class="auth-button" on:click={goToLogin}> Go to Login </button>
				</div>
			</div>
		{/if}
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

	.page-title {
		font-size: 2rem;
		font-weight: 600;
		color: #1a1a1a;
		margin-bottom: 2rem;
		text-align: center;
	}

	.tickets-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
		padding: 1rem;
	}

	.ticket-card {
		background: white;
		border-radius: 1rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		padding: 1.5rem;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	.ticket-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
	}

	.ticket-header {
		border-bottom: 1px solid #e5e7eb;
		padding-bottom: 1rem;
		margin-bottom: 1rem;
	}

	.movie-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1a1a1a;
		margin-bottom: 0.5rem;
	}

	.booking-date {
		font-size: 0.875rem;
		color: #666;
	}

	.ticket-details {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.detail-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0;
	}

	.detail-item:not(:last-child) {
		border-bottom: 1px solid #f3f4f6;
	}

	.detail-label {
		color: #666;
		font-size: 0.875rem;
	}

	.detail-value {
		font-weight: 500;
		color: #1a1a1a;
	}

	.detail-value.code {
		font-family: monospace;
		background-color: #f3f4f6;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.875rem;
	}

	.empty-state {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 60vh;
	}

	.empty-content {
		text-align: center;
		background: white;
		padding: 3rem;
		border-radius: 1rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		max-width: 400px;
		width: 100%;
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
		.page-title {
			font-size: 1.5rem;
			margin-top: 3rem;
		}

		.tickets-grid {
			grid-template-columns: 1fr;
			padding: 0.5rem;
		}

		.empty-content {
			padding: 2rem 1rem;
			margin: 0 1rem;
		}
	}
</style>
