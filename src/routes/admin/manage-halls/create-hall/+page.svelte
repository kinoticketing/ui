<script lang="ts">
	import { writable } from 'svelte/store';
	import { get } from 'svelte/store';

	let row_count: number;
	let col_count: number;
	let hall_name: string;
	let saveMessage: string | null = null;

	// Seat types matching our categories
	let seatTypes = ['Regular', 'VIP', 'Disabled'];
	let rows = writable<string[][]>([[]]);
	let activeDropdown: { rowIndex: number; colIndex: number } | null = null;

	// Zurück navigieren
	function goBack() {
		history.back();
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

	function removeAll() {
		row_count = 0;
		col_count = 0;
		rows.update(() => []);
		hall_name = '';
	}

	function preview() {
		if (row_count > 0 && col_count > 0) {
			rows.set(Array.from({ length: row_count }, () => Array(col_count).fill('Regular')));
		}
	}

	async function save() {
		if (!hall_name?.trim()) {
			saveMessage = 'Please enter a hall name';
			return;
		}

		if (!row_count || !col_count) {
			saveMessage = 'Please specify rows and columns';
			return;
		}

		saveMessage = null;
		const formData = new FormData();
		formData.append('hall_name', hall_name);
		formData.append('row_count', String(row_count));
		formData.append('col_count', String(col_count));
		formData.append('seat_plan', JSON.stringify(get(rows)));

		try {
			const response = await fetch('?/create', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (result.type === 'success') {
				saveMessage = result.message;
				removeAll();
			}
		} catch (error) {
			console.error('Error saving:', error);
			saveMessage = 'An unexpected error occurred';
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
</script>

<svelte:window on:click={handleClickOutside} />

<main>
	<h1 class="page-title">
		<button class="back-btn" on:click={goBack} aria-label="Zurück"> Back </button>
		<span>Create hall</span>
	</h1>
	<div class="container">
		<div class="inputs">
			<input type="text" placeholder="Hall Name" bind:value={hall_name} required />
			<input
				type="number"
				min="1"
				placeholder="Number of Rows"
				bind:value={row_count}
				on:change={preview}
				required
			/>
			<input
				type="number"
				min="1"
				placeholder="Seats per Row"
				bind:value={col_count}
				on:change={preview}
				required
			/>
			<button class="save-btn" on:click={save}>Save</button>
			<button class="delete-btn" on:click={removeAll}>Clear All</button>
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
								: ''}"
							on:click={(event) => toggleDropdown(rowIndex, colIndex, event)}
						>
							<span class="seat-label">{String.fromCharCode(65 + rowIndex)}{colIndex + 1}</span>
							<span class="seat-type">{seat}</span>

							{#if activeDropdown?.rowIndex === rowIndex && activeDropdown?.colIndex === colIndex}
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
					<div class="row-controls">
						<button on:click={() => addColumn(rowIndex)}>+</button>
						<button on:click={() => removeColumn(rowIndex)}>-</button>
					</div>
				</div>
			{/each}
		</div>

		{#if saveMessage}
			<p class="feedback" class:error={saveMessage.includes('error')}>
				{saveMessage}
			</p>
		{/if}
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

	.container {
		padding: 20px;
		max-width: 1200px;
		margin: 0 auto;
	}

	.inputs {
		display: flex;
		gap: 10px;
		margin-bottom: 20px;
		justify-content: center;
		flex-wrap: wrap;
	}

	.inputs input {
		padding: 8px;
		border: 1px solid #ccc;
		border-radius: 4px;
		width: 150px;
	}

	.seat-grid {
		display: flex;
		flex-direction: column;
		gap: 10px;
		align-items: center;
	}

	.seat-row {
		display: flex;
		gap: 5px;
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
		gap: 5px;
		margin-left: 10px;
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
	}

	.row-controls button:hover {
		background: #0b5ed7;
	}

	.save-btn,
	.delete-btn {
		padding: 8px 16px;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-weight: bold;
		transition: background-color 0.2s;
	}

	.save-btn {
		background: #198754;
		color: white;
	}

	.save-btn:hover {
		background: #157347;
	}

	.delete-btn {
		background: #dc3545;
		color: white;
	}

	.delete-btn:hover {
		background: #bb2d3b;
	}

	.feedback {
		margin-top: 20px;
		padding: 10px;
		border-radius: 4px;
		text-align: center;
		background: #d1e7dd;
		color: #0f5132;
	}

	.feedback.error {
		background: #f8d7da;
		color: #842029;
	}
</style>
