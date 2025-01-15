<script lang="ts">
	import { onMount } from 'svelte';
	import '../../i18n.js';
	import { t } from 'svelte-i18n';
	import { i18nReady } from '../../i18n.js';

	interface CoreValue {
		title: string;
		icon: string;
		description: string;
	}

	interface TeamMember {
		key: string;
		name: string;
		role: string;
		bio: string;
		image: string;
	}

	let loaded = false;
	onMount(async () => {
		await i18nReady;
		loaded = true;
	});

	$: coreValues = $t('about.coreValues') as unknown as CoreValue[];
	$: teamMembers = $t('about.teamMembers') as unknown as TeamMember[];
</script>

{#if loaded}
	<main>
		<section class="about-us">
			<div class="header">
				<h1>{$t('about.headerTitle')}</h1>
			</div>

			<div class="content">
				<div class="about-section">
					<div class="about-image">
						<img src="/PlaceholderBlue.png" alt="Cinema" />
					</div>
					<div class="about-text">
						<div class="about-text">
							<h2>{$t('about.ourStoryTitle')}</h2>
							<p>{$t('about.ourStoryParagraph')}</p>

							<h2>{$t('about.ourMissionTitle')}</h2>
							<p>{$t('about.missionStatement')}</p>
						</div>
					</div>
				</div>
				<div>
					<h2>{$t('about.attentionTitle')}</h2>
					<p>
						{$t('about.attentionParagraph')}
					</p>
				</div>

				<div class="values">
					<h2>{$t('about.coreValuesTitle')}</h2>
					<div class="value-grid">
						<!-- If your version of svelte-i18n supports objects/arrays directly, 
					     $t('about.coreValues') will be an array. -->
						{#each coreValues as value (value.title)}
							<div class="value-card">
								<div class="icon">{value.icon}</div>
								<h3>{value.title}</h3>
								<p>{value.description}</p>
							</div>
						{/each}
					</div>
				</div>

				<div class="team">
					<h2>{$t('about.teamTitle')}</h2>
					<div class="team-grid">
						{#each teamMembers as member (member.key)}
							<div class="team-card">
								<div class="profile-image">
									<img src={member.image} alt={member.name} />
								</div>
								<h3>{member.name}</h3>
								<p class="role">{member.role}</p>
								<p>{member.bio}</p>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</section>
	</main>
{/if}

<style>
	.about-us {
		font-family: 'Poppins', sans-serif;
		color: #333;
		line-height: 1.6;
		background-color: #f9f9f9;
	}

	.header {
		text-align: center;
		padding: 2rem 0;
		background-color: #f9f9f9;
		border-bottom: 2px solid #14532d;
	}

	.header h1 {
		font-size: 2.5rem;
		color: #14532d;
		margin: 0;
	}

	.content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 3rem 2rem;
	}

	.about-section {
		display: flex;
		align-items: center;
		gap: 3rem;
		margin-bottom: 3rem;
		background-color: white;
		border-radius: 10px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.about-image {
		flex: 1;
		height: 400px;
	}

	.about-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.about-text {
		flex: 1;
		padding: 2rem;
	}

	.about-text h2 {
		color: #14532d;
		margin-bottom: 1rem;
	}

	.about-text p {
		margin-bottom: 1.5rem;
	}

	.values,
	.team {
		margin-bottom: 3rem;
	}

	.value-grid,
	.team-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 2rem;
	}

	.value-card,
	.team-card {
		background: white;
		border-radius: 8px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		padding: 1.5rem;
		text-align: center;
		transition: transform 0.3s ease;
	}

	.value-card:hover,
	.team-card:hover {
		transform: translateY(-5px);
	}

	.icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.profile-image {
		width: 150px;
		height: 150px;
		border-radius: 50%;
		overflow: hidden;
		margin: 0 auto 1rem;
	}

	.profile-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.role {
		font-weight: bold;
		color: #14532d;
	}

	@media (max-width: 1024px) {
		.value-grid,
		.team-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 768px) {
		.about-section {
			flex-direction: column;
		}

		.about-image {
			height: 300px;
		}

		.value-grid,
		.team-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
