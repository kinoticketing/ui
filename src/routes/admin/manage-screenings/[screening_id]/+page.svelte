<script lang="ts">
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import '../../../../i18n.js';
	import { t } from 'svelte-i18n';

	export let data;
	const { screening } = data;
	let seatPlan = screening?.seat_plan ?? [];

	const seatTypes = {
		vip: { modifier: 5.0, class: 'vip' },
		premium: { modifier: 3.0, class: 'premium' },
		regular: { modifier: 1.0, class: 'regular' },
		disabled: { modifier: 0.8, class: 'disabled' }
	};

	function getSeat(rowIndex: number, colIndex: number) {
		const existingSeat = seatPlan?.[rowIndex]?.[colIndex];
		if (existingSeat) {
			return existingSeat;
		}
		return {
			label: `${String.fromCharCode(65 + rowIndex)}${colIndex + 1}`,
			category: 'regular',
			status: 'active'
		};
	}

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

	function handleSeatClick(rowIndex: number, colIndex: number) {
		console.log(
			`Sitz geklickt: row=${rowIndex}, col=${colIndex}, Wert=`,
			seatPlan[rowIndex][colIndex]
		);
	}

	async function updateSeatPlan() {
		const formData = new FormData();
		formData.append('new_seat_plan', JSON.stringify(seatPlan));
		const response = await fetch('./updateSeatPlan', {
			method: 'POST',
			body: formData
		});
		const result = await response.json();
		if (result.success) {
			alert($t('admin_manageScreenings.hallID.seatPlanUpdated'));
		} else {
			alert('Error: ' + result.error);
		}
	}

	function goBack() {
		goto('/admin/manage-screenings');
	}
</script>

<svelte:head>
	<!-- Title: "Sitzplan für Vorstellung " + screening id -->
	<title>
		{$t('admin_manageScreenings.hallID.pageTitle')}{screening?.screening_id || ''}
	</title>
</svelte:head>

<main>
	{#if !screening}
		<div class="error-message">
			{$t('admin_manageScreenings.hallID.noScreeningFound')}
		</div>
	{:else}
		<div class="container">
			<div class="page-header">
				<button class="back-btn" on:click={goBack}>
					<Icon style="font-size: 1.25rem; margin-right: 0.5rem;" icon="ic:outline-arrow-back" />
					{$t('admin_manageScreenings.hallID.backBtn')}
				</button>
				<h1 class="page-title">
					<!-- "Vorstellung " + screening id -->
					{$t('admin_manageScreenings.hallID.pageHeading')}{screening.screening_id}
				</h1>
			</div>

			<div class="info-card">
				<div class="info-item">
					<span class="label">{$t('admin_manageScreenings.hallID.filmLabel')}</span>
					<span class="value">{screening.movie_title}</span>
				</div>
				<div class="info-item">
					<span class="label">{$t('admin_manageScreenings.hallID.hallLabel')}</span>
					<span class="value">
						{screening.hall_name} (ID: {screening.hall_id})
					</span>
				</div>
				<div class="info-item">
					<span class="label">{$t('admin_manageScreenings.hallID.capacityLabel')}</span>
					<span class="value">{screening.capacity}</span>
				</div>
				<div class="info-item">
					<span class="label">{$t('admin_manageScreenings.hallID.startTimeLabel')}</span>
					<span class="value">{screening.start_time}</span>
				</div>
				<div class="info-item">
					<span class="label">{$t('admin_manageScreenings.hallID.endTimeLabel')}</span>
					<span class="value">{screening.end_time}</span>
				</div>
			</div>

			<div class="seating-section">
				<div class="screen-container">
					<div class="screen" />
					<p class="screen-label">
						{$t('admin_manageScreenings.hallID.screenLabel')}
					</p>
				</div>

				<div class="seat-plan">
					{#each seatPlan as row, rowIndex}
						<div class="seat-row">
							<div class="row-label">
								{String.fromCharCode(65 + rowIndex)}
							</div>
							{#each row.filter((seat) => seat !== null) as seat, colIndex}
								<button
									class="seat {getSeatClass(seat)}"
									title={`${seat.label} ${$t(`admin_manageScreenings.seatTypes.${seat.category.toLowerCase()}`)}`}
									on:click={() => handleSeatClick(rowIndex, colIndex)}
								>
									{seat.label}
								</button>
							{/each}
						</div>
					{/each}
				</div>

				<div class="seat-legend">
					{#each Object.entries(seatTypes) as [type, data]}
						<div class="legend-item">
							<div class="legend-box {data.class}" />
							<span>
								{type.charAt(0).toUpperCase() + type.slice(1)}
							</span>
							<span class="modifier">
								({data.modifier}x)
							</span>
						</div>
					{/each}
				</div>
			</div>

			<button class="save-button" on:click={updateSeatPlan}>
				<Icon style="font-size: 1.25rem; margin-right: 0.5rem;" icon="ic:outline-save" />
				{$t('admin_manageScreenings.hallID.saveSeatingBtn')}
			</button>
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

	.info-card {
		background-color: white;
		border-radius: 0.5rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.info-item {
		display: flex;
		padding: 0.8rem 0;
		border-bottom: 1px solid #e5e7eb;
	}

	.info-item:last-child {
		border-bottom: none;
	}

	.label {
		font-weight: 600;
		width: 120px;
		color: #374151;
	}

	.value {
		color: #1a1a1a;
	}

	.seating-section {
		background-color: white;
		padding: 2rem;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.seat:not(:disabled):hover {
		transform: scale(1.1);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

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
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

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

	.save-button {
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

	.save-button:hover {
		background-color: #218838;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.error-message {
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
</style>
