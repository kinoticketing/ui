<script lang="ts">
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';

	export let data: {
		halls: {
			hall_id: number;
			name: string;
			capacity: number;
			total_rows: number;
			total_columns: number;
			seat_plan: Array<{
				seat_label: string;
				category: string;
				status: string;
			}>;
		}[];
	};

	const seatTypes = {
		vip: { class: 'vip' },
		premium: { class: 'premium' },
		regular: { class: 'regular' },
		disabled: { class: 'disabled' }
	};

	function getSeatClass(seat: any) {
		if (!seat) return 'seat-empty';
		if (seat.status === 'inactive') return 'seat-inactive';

		const categoryLower = seat.category?.toLowerCase() || 'regular';
		for (const [type, data] of Object.entries(seatTypes)) {
			if (categoryLower.includes(type)) {
				return data.class;
			}
		}
		return 'regular';
	}

	function goBack() {
		goto('/admin');
	}

	function goToDetail(hall_id: number) {
		goto(`/admin/manage-halls/${hall_id}`);
	}

	async function deleteHall(hall_id: number) {
		if (!confirm('Sind Sie sicher, dass Sie diesen Saal löschen möchten?')) {
			return;
		}

		const response = await fetch(`/admin/manage-halls/${hall_id}`, {
			method: 'DELETE'
		});

		if (response.ok) {
			location.reload();
		} else {
			alert('Fehler beim Löschen des Saals. Es existieren Tickets für Vorstellungen in diesem Saal!');
		}
	}

	function goToCreateHall() {
		goto('/admin/manage-halls/create-hall');
	}

	function createSeatPlanMatrix(hall: any) {
		if (!hall.seat_plan) return [];

		// Group seats by row_number
		const seatsByRow = hall.seat_plan.reduce((acc: any, seat: any) => {
			const rowMatch = seat.seat_label.match(/^[A-Z]+/);
			const row = rowMatch ? rowMatch[0] : '';
			
			if (!acc[row]) {
				acc[row] = [];
			}
			acc[row].push(seat);
			return acc;
		}, {});

		// Convert to matrix
		return Object.values(seatsByRow).map((row: any) => {
			// Sort seats within each row by column number (extracted from seat label)
			return row.sort((a: any, b: any) => {
				const aNum = parseInt(a.seat_label.match(/\d+/)[0]);
				const bNum = parseInt(b.seat_label.match(/\d+/)[0]);
				return aNum - bNum;
			});
		});
	}
</script>

<svelte:head>
	<title>Säle verwalten</title>
</svelte:head>

<main>
	<div class="container">
		<div class="page-header">
			<button class="back-btn" on:click={goBack}>
				<Icon style="font-size: 1.25rem; margin-right: 0.5rem;" icon="ic:outline-arrow-back" />
				Zurück
			</button>
			<h1 class="page-title">Alle Säle</h1>
		</div>

		{#if data.halls.length > 0}
			<div class="hall-grid">
				{#each data.halls as hall}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<div class="hall-tile" on:click={() => goToDetail(hall.hall_id)}>
						<h3>{hall.name}</h3>
						<p><strong>Kapazität:</strong> {hall.capacity} Sitzplätze</p>

						<div class="seat-plan-preview">
							<div class="screen-preview"></div>
							<div class="seats-preview">
								{#each createSeatPlanMatrix(hall) as row, rowIndex}
									<div class="seat-row-preview">
										{#each row as seat}
											<div class="seat-preview {getSeatClass(seat)}"></div>
										{/each}
									</div>
								{/each}
							</div>
						</div>

						<button class="delete-btn" on:click|stopPropagation={() => deleteHall(hall.hall_id)}>
							<Icon style="font-size: 1.25rem;" icon="ic:outline-delete" />
						</button>
					</div>
				{/each}
			</div>
		{:else}
			<p>Es sind keine Säle vorhanden.</p>
		{/if}

		<button class="create-hall-btn" on:click={goToCreateHall}>
			<Icon style="font-size: 1.25rem; margin-right: 0.5rem;" icon="ic:outline-add" />
			Neuen Saal erstellen
		</button>
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

	.page-header {
		position: relative;
		margin-bottom: 2rem;
	}

	.page-title {
		font-size: 2rem;
		font-weight: 600;
		color: #1a1a1a;
		margin: 0;
		text-align: center;
	}

	.back-btn {
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%);
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

	.hall-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.hall-tile {
		background-color: white;
		padding: 1.25rem;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		cursor: pointer;
		transition: box-shadow 0.2s;
		position: relative;
	}

	.hall-tile:hover {
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.hall-tile h3 {
		margin-top: 0;
	}

	.delete-btn {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background-color: transparent;
		border: none;
		cursor: pointer;
		color: #dc3545;
		transition: color 0.2s;
	}

	.delete-btn:hover {
		color: #c82333;
	}

	.create-hall-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 2rem auto 0;
		padding: 0.75rem 1.25rem;
		background-color: transparent;
		color: #28a745;
		border: 2px solid #28a745;
		border-radius: 0.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.create-hall-btn:hover {
		background-color: #218838;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		color: white;
	}

	.seat-plan-preview {
		margin-top: 1rem;
		background: #f8f9fa;
		padding: 1rem;
		border-radius: 0.5rem;
	}

	.screen-preview {
		height: 4px;
		background: linear-gradient(to right, #e2e8f0, #94a3b8, #e2e8f0);
		margin: 0 auto 0.5rem;
		width: 80%;
		border-radius: 2px;
	}

	.seats-preview {
		display: flex;
		flex-direction: column;
		gap: 2px;
		align-items: center;
	}

	.seat-row-preview {
		display: flex;
		gap: 2px;
	}

	.seat-preview {
		width: 8px;
		height: 8px;
		border-radius: 2px;
		background-color: #e5e7eb;
	}

	.seat-preview.vip {
		background-color: #fcd34d;
	}
	.seat-preview.premium {
		background-color: #f87171;
	}
	.seat-preview.regular {
		background-color: #93c5fd;
	}
	.seat-preview.disabled {
		background-color: #86efac;
	}
	.seat-preview.seat-inactive {
		background-color: #9ca3af;
	}
	.seat-preview.seat-empty {
		visibility: hidden;
	}
</style>
