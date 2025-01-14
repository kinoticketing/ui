<script lang="ts">
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';

	export let data: { halls: { hall_id: number; name: string; capacity: number }[] };

	// Zurück navigieren
	function goBack() {
		goto('/admin');
	}

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
			<ul class="hall-list">
				{#each data.halls as hall}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
					<li class="hall-item" on:click={() => goToDetail(hall.hall_id)}>
						<p><strong>Name:</strong> {hall.name}</p>
						<p><strong>Kapazität:</strong> {hall.capacity} Sitzplätze</p>
						<button class="delete-btn" on:click|stopPropagation={() => deleteHall(hall.hall_id)}>
							<Icon style="font-size: 1.25rem; margin-right: 0.5rem;" icon="ic:outline-delete" />
							Saal löschen
						</button>
					</li>
				{/each}
			</ul>
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
		max-width: 800px;
		margin: 0 auto;
	}

	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 2rem;
	}

	.page-title {
		font-size: 2rem;
		font-weight: 600;
		color: #1a1a1a;
		margin: 0;
		text-align: center;
		width: 100%;
	}

	.back-btn {
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

	.hall-list {
		list-style-type: none;
		padding: 0;
		margin: 0;
	}

	.hall-item {
		background-color: white;
		padding: 1.25rem;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 1rem;
		cursor: pointer;
		transition: box-shadow 0.2s;
	}

	.hall-item:hover {
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.delete-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background-color: #dc3545;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 0.25rem;
		cursor: pointer;
		font-weight: 500;
		transition: background-color 0.2s;
		margin-top: 1rem;
	}

	.delete-btn:hover {
		background-color: #c82333;
	}

	.create-hall-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 2rem auto 0;
		padding: 0.75rem 1.25rem;
		background-color: #28a745;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.create-hall-btn:hover {
		background-color: #218838;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
</style>
