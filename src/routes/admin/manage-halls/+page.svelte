<script lang="ts">
	import { goto } from '$app/navigation';

	export let data: { halls: { hall_id: number; name: string; capacity: number }[] };

	// Zur Detailseite navigieren
	function goToDetail(hall_id: number) {
		goto(`/admin/manage-halls/${hall_id}`);
	}

	// Saal löschen
	async function deleteHall(hall_id: number) {
		if (!confirm('Sind Sie sicher, dass Sie diesen Saal löschen möchten?')) {
			return;
		}

		const response = await fetch(`/admin/manage-halls/${hall_id}`, {
			method: 'DELETE'
		});

		if (response.ok) {
			// Seite neu laden, um die Liste zu aktualisieren
			location.reload();
		} else {
			alert('Fehler beim Löschen des Saals.');
		}
	}

	function goToCreateHall() {
		goto('/admin/manage-halls/create-hall');
	}
</script>

<main>
	<h1>Alle Säle</h1>

	{#if data.halls.length > 0}
		<ul class="hall-list">
			{#each data.halls as hall}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
				<li class="hall-item" on:click={() => goToDetail(hall.hall_id)}>
					<p><strong>Name:</strong> {hall.name}</p>
					<p><strong>Kapazität:</strong> {hall.capacity} Sitzplätze</p>
					<button class="delete-btn" on:click|stopPropagation={() => deleteHall(hall.hall_id)}>
						Saal löschen
					</button>
				</li>
			{/each}
		</ul>
	{:else}
		<p>Es sind keine Säle vorhanden.</p>
	{/if}

	<button class="create-hall-btn" on:click={goToCreateHall}>Neuen Saal erstellen</button>
</main>

<style>
	h1 {
		text-align: center;
		margin-bottom: 20px;
	}

	.hall-list {
		list-style-type: none;
		padding: 0;
		max-width: 600px;
		margin: 0 auto 20px;
	}

	.hall-item {
		background-color: #f9f9f9;
		padding: 15px;
		margin-bottom: 10px;
		border: 1px solid #ddd;
		border-radius: 5px;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.hall-item:hover {
		background-color: #e9ecef;
	}

	.delete-btn {
		background-color: #dc3545;
		color: white;
		border: none;
		padding: 5px 10px;
		border-radius: 3px;
		cursor: pointer;
		font-size: 14px;
		margin-top: 10px;
	}

	.delete-btn:hover {
		background-color: #c82333;
	}

	.create-hall-btn {
		display: block;
		margin: 20px auto;
		padding: 10px 20px;
		font-size: 16px;
		background-color: #28a745;
		color: white;
		border: none;
		border-radius: 5px;
		cursor: pointer;
	}

	.create-hall-btn:hover {
		background-color: #218838;
	}
</style>
