<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	export let data;

	let searchTerm = '';
	$: filteredReservations = data.reservations.filter(
		(reservation) =>
			reservation.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
			reservation.movie_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			reservation.ticket_id.toString().includes(searchTerm)
	);

	function navigateToDetails(id: string) {
		goto(`/admin/manage-reservations/${id}`);
	}

	// Zurück navigieren
	function goBack() {
		goto('/admin');
	}
</script>

<svelte:head>
	<title>Reservierungen verwalten</title>
</svelte:head>

<main>
	<div class="container">
		<h1 class="page-title">
			<button class="back-btn" on:click={goBack}>
				<Icon style="font-size: 1.25rem; margin-right: 0.5rem;" icon="ic:outline-arrow-back" />
				Zurück
			</button>
			<span>Reservierungen verwalten</span>
		</h1>

		<input
			type="text"
			placeholder="Suche nach Benutzer, Film oder Ticket-ID"
			bind:value={searchTerm}
		/>

		<div class="table-container">
			<table>
				<thead>
					<tr>
						<th>Ticket ID</th>
						<th>Ticket Code</th>
						<th>Benutzer</th>
						<th>Film</th>
						<th>Vorstellung</th>
						<th>Saal</th>
						<th>Sitz</th>
						<th class="price-column">Preis</th>
						<th>Status</th>
						<th>Erstellt am</th>
						<th>Aktionen</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredReservations as reservation}
						<tr class="clickable-row" on:click={() => navigateToDetails(reservation.ticket_id)}>
							<td>{reservation.ticket_id}</td>
							<td>{reservation.ticket_code}</td>
							<td>{reservation.username}</td>
							<td>{reservation.movie_title}</td>
							<td>{new Date(reservation.start_time).toLocaleString()}</td>
							<td>{reservation.hall_name}</td>
							<td>{reservation.seat_label}</td>
							<td class="price-column">{reservation.price} €</td>
							<td><span class="status {reservation.status}">{reservation.status}</span></td>
							<td>{new Date(reservation.created_at).toLocaleString()}</td>
							<td>
								{#if reservation.status !== 'cancelled'}
									<!-- svelte-ignore a11y-click-events-have-key-events -->
									<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
									<form method="POST" action="?/cancel" use:enhance on:click|stopPropagation>
										<input type="hidden" name="ticketId" value={reservation.ticket_id} />
										<button type="submit" class="cancel-btn"> Stornieren </button>
									</form>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</main>

<style>
	.page-title {
		position: relative;
		text-align: center;
		margin-bottom: 20px;
	}

	.back-btn {
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

	.back-btn:hover {
		background-color: #f3f4f6;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.clickable-row {
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.clickable-row:hover {
		background-color: #f3f4f6;
	}
	.price-column {
		min-width: 10px;
		white-space: nowrap;
	}
	main {
		min-height: 100vh;
		background-color: #f8f9fa;
		padding: 2rem 1rem;
	}

	.container {
		width: 100%;
		max-width: 1400px; /* Increased from default */
		margin: 0 auto;
		padding: 1rem;
	}

	h1 {
		font-size: 2rem;
		font-weight: 600;
		color: #1a1a1a;
		margin-bottom: 1.5rem;
		text-align: center;
	}

	input {
		width: 100%;
		padding: 0.75rem 1rem;
		margin-bottom: 1.5rem;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		font-size: 1rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.table-container {
		margin: 1rem 0;
		background: white;
		border-radius: 1rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
		width: 100%;
		overflow-x: auto;
	}

	table {
		width: 100%;
		min-width: 1200px;
		border-collapse: collapse;
		font-size: 0.875rem;
		table-layout: fixed; /* Added for consistent column widths */
	}

	th,
	td {
		padding: 1rem;
		text-align: left;
		border-bottom: 1px solid #e5e7eb;
		width: auto; /* Let columns take natural width */
	}

	th {
		position: sticky;
		top: 0;
		background: #f8fafc;
		color: #64748b;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 1rem;
		border-bottom: 2px solid #e2e8f0;
	}

	td {
		padding: 1rem;
		border-bottom: 1px solid #e2e8f0;
		color: #334155;
	}

	tr:hover {
		background-color: #f8fafc;
		transition: background-color 0.2s ease;
	}

	tr:last-child td {
		border-bottom: none;
	}

	.status {
		display: inline-flex;
		align-items: center;
		padding: 0.375rem 0.75rem;
		border-radius: 9999px;
		font-weight: 500;
		font-size: 0.75rem;
	}

	.status.pending {
		background-color: #fef3c7;
		color: #d97706;
	}

	.status.confirmed {
		background-color: #dcfce7;
		color: #15803d;
	}

	.status.cancelled {
		background-color: #fee2e2;
		color: #dc2626;
	}

	.cancel-btn {
		background-color: #ef4444;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.cancel-btn:hover {
		background-color: #dc2626;
	}

	/* Custom scrollbar for better UX */
	.table-container::-webkit-scrollbar {
		height: 6px;
	}

	.table-container::-webkit-scrollbar-track {
		background: #f1f5f9;
	}

	.table-container::-webkit-scrollbar-thumb {
		background: #cbd5e1;
		border-radius: 3px;
	}

	.table-container::-webkit-scrollbar-thumb:hover {
		background: #94a3b8;
	}

	@media (max-width: 1400px) {
		.table-container {
			overflow-x: auto;
		}
	}

	@media (max-width: 640px) {
		h1 {
			font-size: 1.5rem;
		}

		th,
		td {
			padding: 0.75rem;
		}

		.status {
			padding: 0.25rem 0.5rem;
			font-size: 0.7rem;
		}
	}
</style>
