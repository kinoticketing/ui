<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '@iconify/svelte';

	export let data;
	const { reservation } = data;

	function formatDateTime(date: string) {
		return new Date(date).toLocaleString();
	}

	function formatDuration(minutes: number) {
		const hours = Math.floor(minutes / 60);
		const remainingMinutes = minutes % 60;
		return `${hours}h ${remainingMinutes}min`;
	}
</script>

<svelte:head>
	<title>Reservierungsdetails - {reservation.ticket_id}</title>
</svelte:head>

<main>
	<div class="container">
		<a href="/admin/manage-reservations" class="back-button">
			<Icon icon="mdi:arrow-left" width="20" height="20" />
			Zurück zur Übersicht
		</a>

		<h1>Reservierungsdetails</h1>

		<div class="detail-container">
			<div class="ticket-header">
				<div class="ticket-id">
					<span class="label">Ticket ID:</span>
					<span class="value">{reservation.ticket_id}</span>
				</div>
				<div class="ticket-code">
					<span class="label">Ticket Code:</span>
					<span class="value">{reservation.ticket_code}</span>
				</div>
				<div class="ticket-status">
					<span class="label">Status:</span>
					<span class="status {reservation.status}">{reservation.status}</span>
				</div>
			</div>

			<div class="detail-grid">
				<div class="detail-section">
					<h2>Ticketinformationen</h2>
					<p><strong>Preis:</strong> {reservation.price} €</p>
					<p><strong>Erstellt am:</strong> {formatDateTime(reservation.created_at)}</p>
				</div>

				<div class="detail-section">
					<h2>Benutzerinformationen</h2>
					<p><strong>Benutzername:</strong> {reservation.username}</p>
					<p><strong>E-Mail:</strong> {reservation.email}</p>
				</div>

				<div class="detail-section">
					<h2>Filminformationen</h2>
					<p><strong>Filmtitel:</strong> {reservation.movie_title}</p>
					<p><strong>Dauer:</strong> {formatDuration(reservation.duration)}</p>
					<p><strong>Vorstellungsbeginn:</strong> {formatDateTime(reservation.start_time)}</p>
					<p><strong>Vorstellungsende:</strong> {formatDateTime(reservation.end_time)}</p>
				</div>

				<div class="detail-section">
					<h2>Saalinformationen</h2>
					<p><strong>Saalname:</strong> {reservation.hall_name}</p>
					<p>
						<strong>Sitzplatz:</strong>
						{reservation.seat_label} (Reihe {reservation.row_number}, Spalte {reservation.column_number})
					</p>
				</div>
			</div>
		</div>

		{#if reservation.status !== 'cancelled'}
			<form method="POST" action="?/cancel" use:enhance class="cancel-form">
				<button type="submit" class="cancel-btn">Reservierung stornieren</button>
			</form>
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
		max-width: 1000px;
		margin: 0 auto;
		position: relative;
	}

	.back-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background-color: #e5e7eb;
		border-radius: 0.375rem;
		color: #374151;
		text-decoration: none;
		font-weight: 500;
		margin-bottom: 1.5rem;
		transition: background-color 0.2s;
	}

	.back-button:hover {
		background-color: #d1d5db;
	}

	h1 {
		font-size: 2.25rem;
		font-weight: 700;
		color: #1a1a1a;
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.detail-container {
		background: white;
		border-radius: 1rem;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
		padding: 2rem;
		margin-bottom: 2rem;
	}

	.ticket-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 1.5rem;
		margin-bottom: 1.5rem;
		border-bottom: 2px solid #e5e7eb;
	}

	.ticket-header .label {
		font-size: 0.875rem;
		color: #6b7280;
		display: block;
		margin-bottom: 0.25rem;
	}

	.ticket-header .value {
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
	}

	.detail-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
	}

	.detail-section {
		background-color: #f9fafb;
		padding: 1.5rem;
		border-radius: 0.5rem;
	}

	h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #374151;
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	p {
		margin-bottom: 0.75rem;
		display: flex;
		justify-content: space-between;
	}

	p strong {
		color: #4b5563;
	}

	.status {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
		text-transform: capitalize;
	}

	.status.pending {
		background-color: #fef3c7;
		color: #d97706;
	}

	.status.confirmed {
		background-color: #d1fae5;
		color: #047857;
	}

	.status.cancelled {
		background-color: #fee2e2;
		color: #dc2626;
	}

	.cancel-form {
		text-align: center;
	}

	.cancel-btn {
		background-color: #ef4444;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 0.375rem;
		font-weight: 500;
		font-size: 1rem;
		cursor: pointer;
		transition:
			background-color 0.2s,
			transform 0.1s;
	}

	.cancel-btn:hover {
		background-color: #dc2626;
		transform: translateY(-1px);
	}

	.cancel-btn:active {
		transform: translateY(1px);
	}

	@media (max-width: 768px) {
		.ticket-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.detail-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 640px) {
		h1 {
			font-size: 1.75rem;
		}

		.detail-container {
			padding: 1.5rem;
		}
	}
</style>
