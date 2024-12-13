<script lang="ts">
	import { writable } from 'svelte/store';
	import { get } from 'svelte/store';

	let row_count: number;
	let col_count: number;
	let hall_name: string;
	let saveMessage: string | null = null;

	// Default Sitztypen
	let seatTypes = ['Regular', 'VIP', 'Behindert'];
	let rows = writable<string[][]>([[]]);
	let activeDropdown: { rowIndex: number; colIndex: number } | null = null;

	function addColumn(rowIndex: number) {
		col_count++;
		rows.update((r) => {
			r[rowIndex].push('Regular');
			return r;
		});
	}

	function removeColumn(rowIndex: number) {
		col_count--;
		rows.update((r) => {
			r[rowIndex].pop();
			return r;
		});
	}

	function removeAll() {
		row_count = 0;
		col_count = 0;
		rows.update(() => []);
	}

	function preview() {
		rows.set(Array.from({ length: row_count }, () => Array(col_count).fill('Regular')));
	}

	async function save() {
		saveMessage = null; // Nachricht zurücksetzen
		const formData = new FormData();
		formData.append('hall_name', hall_name);
		formData.append('row_count', String(row_count));
		formData.append('col_count', String(col_count));
		formData.append('seat_plan', JSON.stringify(get(rows))); // Sitzplan in JSON umwandeln

		try {
			const response = await fetch('/admin/manage-halls/create-hall', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				const result = await response.json();
				saveMessage = result.message || 'Saal erfolgreich gespeichert!';
				removeAll();
			} else {
				const error = await response.json();
				saveMessage = error.message || 'Es ist ein Fehler aufgetreten.';
			}
		} catch (error) {
			console.error('Fehler beim Speichern:', error);
			saveMessage = 'Ein unerwarteter Fehler ist aufgetreten.';
		}
	}

	function changeSeatType(rowIndex: number, colIndex: number, newType: string) {
		rows.update((r) => {
			r[rowIndex][colIndex] = newType;
			return r;
		});
		$activeDropdown = null;
	}

	function toggleDropdown(rowIndex: number, colIndex: number) {
		activeDropdown =
			activeDropdown?.rowIndex === rowIndex && activeDropdown?.colIndex === colIndex
				? null
				: { rowIndex, colIndex };
	}
</script>

<main>
	<h1>Saal anlegen</h1>
	<div class="container">
		<div class="inputs">
			<input type="text" placeholder="Name des Saals" bind:value={hall_name} />
			<input
				type="number"
				min="0"
				placeholder="Anzahl Reihen"
				bind:value={row_count}
				on:change={preview}
			/>
			<input
				type="number"
				min="0"
				placeholder="Anzahl Sitze pro Reihe"
				bind:value={col_count}
				on:change={preview}
			/>
			<button class="safe-btn" on:click={save}>Speichern</button>
			<button class="delete-btn" on:click={removeAll}>Alle Reihen löschen</button>
		</div>

		<div class="seat-grid">
			{#each $rows as row, rowIndex}
				<div class="seat-row">
					{#each row as seat, colIndex}
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<div class="seat" on:click={() => toggleDropdown(rowIndex, colIndex)}>
							{seat}
							{#if activeDropdown?.rowIndex === rowIndex && activeDropdown?.colIndex === colIndex}
								<div class="dropdown">
									{#each seatTypes as type}
										<div
											class="dropdown-item"
											on:click={() => changeSeatType(rowIndex, colIndex, type)}
										>
											{type}
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/each}
					<button on:click={() => addColumn(rowIndex)}>+</button>
					<button on:click={() => removeColumn(rowIndex)}>-</button>
				</div>
			{/each}
			{#if saveMessage}
				<p class="feedback">{saveMessage}</p>
			{/if}
		</div>
	</div>
</main>

<style>
	.feedback {
		text-align: center;
		margin-top: 20px;
		font-size: 16px;
		color: green;
	}

	h1 {
		text-align: center;
		margin: 20px 0;
	}

	.container {
		padding: 20px;
	}

	.seat-grid {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		margin-top: 10px;
	}

	.seat-row {
		display: flex;
		gap: 5px;
	}

	.seat {
		position: relative;
		width: 50px;
		height: 50px;
		border: 1px solid #ccc;
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 4px;
		font-size: 12px;
		background-color: #f0f0f0;
		cursor: pointer;
	}

	.seat:hover {
		background-color: #e0e0e0;
	}

	.dropdown {
		position: absolute;
		top: 60px;
		left: 0;
		background: white;
		border: 1px solid #ccc;
		border-radius: 4px;
		z-index: 10;
		box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
	}

	.dropdown-item {
		padding: 5px 10px;
		cursor: pointer;
	}

	.dropdown-item:hover {
		background-color: #f0f0f0;
	}

	.inputs {
		display: flex;
		justify-content: center;
		gap: 10px;
	}

	.safe-btn,
	.delete-btn {
		padding: 10px;
		font-size: 14px;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.safe-btn {
		background-color: #28a745;
		color: white;
	}

	.delete-btn {
		background-color: #dc3545;
		color: white;
	}

	.seat-row button {
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		padding: 5px 10px;
		cursor: pointer;
	}

	.seat-row button:hover {
		background-color: #0056b3;
	}
</style>
