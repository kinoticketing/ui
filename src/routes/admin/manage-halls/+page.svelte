<script lang="ts">
	export let data: { halls: { hall_id: number; name: string; capacity: number }[] };

	function goToCreateHall() {
		window.location.href = '/admin/manage-halls/create-hall';
	}
</script>

<main>
	<h1>Alle Säle</h1>

	{#if data.halls.length > 0}
		<ul class="hall-list">
			{#each data.halls as hall}
				<li class="hall-item">
					<p><strong>Name:</strong> {hall.name}</p>
					<p><strong>Kapazität:</strong> {hall.capacity} Sitzplätze</p>
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
