<script lang="ts">
	import { enhance } from '$app/forms';
	export let data;

	let searchTerm = '';
	$: filteredReservations = data.reservations.filter(
		(reservation) =>
			reservation.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
			reservation.movie_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			reservation.ticket_id.toString().includes(searchTerm)
	);
</script>

<svelte:head>
	<title>Reservierungen verwalten</title>
</svelte:head>

<main>
	<div class="container">
		<h1>Reservierungen verwalten</h1>

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
						<th>Benutzer</th>
						<th>Film</th>
						<th>Vorstellung</th>
						<th>Saal</th>
						<th>Sitz</th>
						<th>Preis</th>
						<th>Status</th>
						<th>Erstellt am</th>
						<th>Aktionen</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredReservations as reservation}
						<tr>
							<td>{reservation.ticket_id}</td>
							<td>{reservation.username}</td>
							<td>{reservation.movie_title}</td>
							<td>{new Date(reservation.start_time).toLocaleString()}</td>
							<td>{reservation.hall_name}</td>
							<td>{reservation.seat_label}</td>
							<td>{reservation.price} €</td>
							<td><span class="status {reservation.status}">{reservation.status}</span></td>
							<td>{new Date(reservation.created_at).toLocaleString()}</td>
							<td>
								{#if reservation.status !== 'cancelled'}
									<form method="POST" action="?/cancel" use:enhance>
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
		background: white;
		border-radius: 1rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	table {
		width: 100%;
		border-collapse: separate;
		border-spacing: 0;
	}

	th,
	td {
		padding: 1rem;
		text-align: left;
		border-bottom: 1px solid #e5e7eb;
	}

	th {
		background-color: #f3f4f6;
		font-weight: 600;
		color: #374151;
		text-transform: uppercase;
		font-size: 0.875rem;
	}

	tr:last-child td {
		border-bottom: none;
	}

	.status {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
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

	@media (max-width: 1024px) {
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
	}
</style>
