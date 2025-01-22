<script lang="ts">
	import { goto } from '$app/navigation';
	import { writable } from 'svelte/store';
	import { get } from 'svelte/store';
	import Icon from '@iconify/svelte';

	export let data;
	let { hall, error } = data;

	let isEditMode = false;
	let saveMessage: string | null = null;
	let activeDropdown: { rowIndex: number; colIndex: number } | null = null;

	// Initialisiere die Stores mit den Daten des bestehenden Saals
	let hall_name = hall?.name || '';
	let row_count = hall?.total_rows || 0;
	let col_count = hall?.total_columns || 0;
	let rows = writable<string[][]>([[]]);

	// Seat types matching our categories
	const seatTypes = ['Regular', 'VIP', 'Premium', 'Disabled'];

	// Initialisiere den Sitzplan aus den bestehenden Daten
	function initializeSeatPlan() {
		const initialPlan = hall.seat_plan.map((row) =>
			row.map((seat) => (seat ? seat.category : 'Regular'))
		);
		rows.set(initialPlan);
	}

	// Initialisiere den Plan wenn hall Daten vorhanden sind
	if (hall) {
		initializeSeatPlan();
	}

	function toggleEditMode() {
		isEditMode = !isEditMode;
		if (isEditMode) {
			initializeSeatPlan();
		}
	}

	function addColumn(rowIndex: number) {
		col_count++;
		rows.update((r) => {
			r[rowIndex].push('Regular');
			return r;
		});
	}

	function removeColumn(rowIndex: number) {
		if (col_count > 0) {
			col_count--;
			rows.update((r) => {
				r[rowIndex].pop();
				return r;
			});
		}
	}

	function addRow() {
		row_count++;
		rows.update((r) => {
			r.push(Array(col_count).fill('Regular'));
			return r;
		});
	}

	function removeRow() {
		if (row_count > 0) {
			row_count--;
			rows.update((r) => {
				r.pop();
				return r;
			});
		}
	}

	function changeSeatType(rowIndex: number, colIndex: number, newType: string) {
		rows.update((r) => {
			r[rowIndex][colIndex] = newType;
			return r;
		});
		activeDropdown = null;
	}

	function toggleDropdown(rowIndex: number, colIndex: number, event: MouseEvent) {
		if (activeDropdown?.rowIndex === rowIndex && activeDropdown?.colIndex === colIndex) {
			activeDropdown = null;
		} else {
			activeDropdown = { rowIndex, colIndex };
		}
		event.stopPropagation();
	}

	function handleClickOutside(event: MouseEvent) {
		if (activeDropdown) {
			const dropdownElement = document.querySelector('.dropdown');
			if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
				activeDropdown = null;
			}
		}
	}

	async function saveSeatPlan() {
		if (!hall_name?.trim()) {
			saveMessage = 'Bitte geben Sie einen Saalnamen ein';
			return;
		}

		if (!row_count || !col_count) {
			saveMessage = 'Bitte geben Sie Reihen und Spalten an';
			return;
		}

		const currentRows = get(rows);

		// Erstelle den neuen Sitzplan im korrekten Format
		const newSeatPlan = currentRows.map((row, rowIndex) =>
			row.map((category, colIndex) => ({
				label: `${String.fromCharCode(65 + rowIndex)}${colIndex + 1}`,
				category: category,
				status: 'active'
			}))
		);

		try {
			const response = await fetch(`/admin/manage-halls/${hall.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: hall_name,
					total_rows: row_count,
					total_columns: col_count,
					seat_plan: newSeatPlan
				})
			});

			if (response.ok) {
				saveMessage = 'Änderungen erfolgreich gespeichert';
				isEditMode = false;
				// Aktualisiere die hall-Daten
				hall = {
					...hall,
					name: hall_name,
					total_rows: row_count,
					total_columns: col_count,
					seat_plan: newSeatPlan
				};
			} else {
				throw new Error('Failed to save changes');
			}
		} catch (error) {
			console.error('Error saving changes:', error);
			saveMessage = 'Ein Fehler ist aufgetreten';
		}
	}

	function goBack() {
		goto('/admin/manage-halls');
	}
</script>

<svelte:window on:click={handleClickOutside} />

<main>
	{#if hall}
		<div class="container">
			<header class="header">
				<h1 class="page-title">
					<button class="back-btn" on:click={goBack}>
						<Icon style="font-size: 1.25rem; margin-right: 0.5rem;" icon="ic:outline-arrow-back" />
						Zurück
					</button>
					<span>{hall.name}</span>
				</h1>

				<!-- Edit Mode Toggle -->
				<div class="edit-controls">
					<button class="edit-toggle-btn {isEditMode ? 'active' : ''}" on:click={toggleEditMode}>
						<Icon icon={isEditMode ? 'mdi:pencil-off' : 'mdi:pencil'} />
						{isEditMode ? 'Bearbeitungsmodus aus' : 'Bearbeitungsmodus an'}
					</button>
				</div>
			</header>

			{#if isEditMode}
				<div class="inputs">
					<input type="text" placeholder="Saalname" bind:value={hall_name} required />
					<div class="row-management">
						<button class="management-btn" on:click={addRow}>
							<Icon icon="mdi:plus" /> Reihe hinzufügen
						</button>
						<button class="management-btn" on:click={removeRow}>
							<Icon icon="mdi:minus" /> Reihe entfernen
						</button>
					</div>
					<button class="save-btn" on:click={saveSeatPlan}>
						<Icon icon="mdi:content-save" />
						Speichern
					</button>
				</div>
			{/if}

			<div class="seating-section">
				<div class="screen-container">
					<div class="screen"></div>
					<p class="screen-label">Leinwand</p>
				</div>

				<div class="seat-grid">
					{#each $rows as row, rowIndex}
						<div class="seat-row">
							<span class="row-label">{String.fromCharCode(65 + rowIndex)}</span>
							{#each row as seat, colIndex}
								<!-- svelte-ignore a11y-click-events-have-key-events -->
								<!-- svelte-ignore a11y-no-static-element-interactions -->
								<div
									class="seat {seat.toLowerCase()} {activeDropdown?.rowIndex === rowIndex &&
									activeDropdown?.colIndex === colIndex
										? 'active'
										: ''} {isEditMode ? 'editable' : ''}"
									on:click={(event) => isEditMode && toggleDropdown(rowIndex, colIndex, event)}
								>
									<span class="seat-label">{String.fromCharCode(65 + rowIndex)}{colIndex + 1}</span>
									<span class="seat-type">{seat}</span>

									{#if isEditMode && activeDropdown?.rowIndex === rowIndex && activeDropdown?.colIndex === colIndex}
										<div class="dropdown">
											{#each seatTypes as type}
												<div
													class="dropdown-item"
													on:click|stopPropagation={() => changeSeatType(rowIndex, colIndex, type)}
												>
													{type}
												</div>
											{/each}
										</div>
									{/if}
								</div>
							{/each}
							{#if isEditMode}
								<div class="row-controls">
									<button on:click={() => addColumn(rowIndex)}>+</button>
									<button on:click={() => removeColumn(rowIndex)}>-</button>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>

			{#if saveMessage}
				<p class="feedback" class:error={saveMessage.includes('error')}>
					{saveMessage}
				</p>
			{/if}
		</div>
	{/if}
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

	.header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.page-title {
		position: relative;
		text-align: center;
		margin-bottom: 20px;
	}

	.back-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		position: absolute;
		left: 0;
		top: 0;
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

	.title {
		font-size: 2rem;
		margin: 0;
	}

	.info {
		color: #666;
		margin: 0.5rem 0;
	}

	.seating-section {
		background: white;
		padding: 2rem;
		border-radius: 1rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.screen-container {
		margin-bottom: 3rem;
		text-align: center;
	}

	.screen {
		height: 8px;
		background: linear-gradient(to right, #e2e8f0, #94a3b8, #e2e8f0);
		margin: 0 auto 1rem;
		width: 80%;
		border-radius: 4px;
	}

	.screen-label {
		font-size: 0.875rem;
		color: #666;
	}

	.seat-plan {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: center;
	}

	.seat-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.row-label {
		width: 2rem;
		text-align: right;
		font-weight: bold;
	}

	.seat {
		width: 2.5rem;
		height: 2.5rem;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #1a1a1a;
	}

	.seat:not(:disabled):hover {
		transform: scale(1.1);
	}

	/* Updated seat type colors */
	.seat.vip {
		background-color: #fcd34d;
		color: #000;
	}
	.seat.premium {
		background-color: #f87171;
		color: #fff;
	}
	.seat.regular {
		background-color: #93c5fd;
		color: #000;
	}
	.seat.disabled {
		background-color: #86efac;
		color: #000;
	}
	.seat.seat-inactive {
		background-color: #9ca3af;
		color: #fff;
	}
	.seat.seat-empty {
		visibility: hidden;
	}

	.seat-legend {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin-top: 2rem;
		flex-wrap: wrap;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.legend-box {
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 0.25rem;
	}

	/* Legend box colors matching seat colors */
	.legend-box.vip {
		background-color: #fcd34d;
	}
	.legend-box.premium {
		background-color: #f87171;
	}
	.legend-box.regular {
		background-color: #93c5fd;
	}
	.legend-box.disabled {
		background-color: #86efac;
	}

	.modifier {
		color: #666;
		font-size: 0.875rem;
	}

	.error {
		text-align: center;
		color: #ef4444;
		padding: 2rem;
	}

	@media (max-width: 768px) {
		.seat {
			width: 2rem;
			height: 2rem;
			font-size: 0.625rem;
		}

		.seat-legend {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}
	}
	.edit-controls {
		display: flex;
		justify-content: center;
		margin: 1rem 0;
	}

	.edit-toggle-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		border-radius: 0.5rem;
		background-color: #f3f4f6;
		border: 1px solid #e5e7eb;
		cursor: pointer;
		transition: all 0.2s;
	}

	.edit-toggle-btn.active {
		background-color: #3b82f6;
		color: white;
	}

	.row-management {
		display: flex;
		gap: 1rem;
	}

	.management-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		background-color: #f3f4f6;
		border: 1px solid #e5e7eb;
		cursor: pointer;
		transition: all 0.2s;
	}

	.management-btn:hover {
		background-color: #e5e7eb;
	}

	.seat.editable {
		cursor: pointer;
	}

	.seat.editable:hover {
		transform: scale(1.1);
	}

	.container {
		max-width: 1200px;
		background-color: #ffffff;
		padding: 2rem;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

	.inputs {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.inputs input {
		padding: 0.5rem;
		font-size: 1rem;
		border: 1px solid #d1d5db;
		border-radius: 0.25rem;
		width: 200px;
		transition: border-color 0.2s ease;
	}

	.inputs input:focus {
		border-color: #6b7280;
		outline: none;
	}

	.seat-grid {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: center;
	}

	.seat-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.row-label {
		width: 30px;
		text-align: center;
		font-weight: bold;
	}

	.seat {
		position: relative;
		width: 60px;
		height: 60px;
		border: 2px solid #ccc;
		border-radius: 6px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		cursor: pointer;
		background: #f8f9fa;
		transition: all 0.2s;
	}

	.seat.active {
		z-index: 1001;
	}

	.seat.regular {
		background: #e9ecef;
	}

	.seat.vip {
		background: #fff3cd;
		border-color: #ffc107;
	}

	.seat.disabled {
		background: #d1e7dd;
		border-color: #198754;
	}

	.seat:hover {
		transform: scale(1.05);
	}

	.seat-label {
		font-size: 12px;
		color: #666;
	}

	.seat-type {
		font-size: 14px;
		font-weight: bold;
	}

	.dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		background: white;
		border: 1px solid #ccc;
		border-radius: 4px;
		z-index: 1000;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		width: 100px;
	}

	.dropdown-item {
		padding: 8px 12px;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.dropdown-item:hover {
		background-color: #f8f9fa;
	}

	.row-controls {
		display: flex;
		gap: 0.5rem;
		margin-left: 1rem;
	}

	.row-controls button {
		width: 30px;
		height: 30px;
		border: none;
		border-radius: 4px;
		background: #0d6efd;
		color: white;
		cursor: pointer;
		transition: background-color 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
		font-weight: bold;
	}

	.row-controls button:hover {
		background: #0b5ed7;
	}

	.save-btn,
	.delete-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		border: none;
		border-radius: 0.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.save-btn {
		background-color: #28a745;
		color: white;
	}

	.save-btn:hover {
		background-color: #218838;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.delete-btn {
		background-color: #dc3545;
		color: white;
	}

	.delete-btn:hover {
		background-color: #c82333;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.feedback {
		margin-top: 2rem;
		padding: 1rem;
		border-radius: 0.5rem;
		text-align: center;
		background: #d1e7dd;
		color: #0f5132;
		font-weight: 500;
	}

	.feedback.error {
		background: #f8d7da;
		color: #842029;
	}
</style>
