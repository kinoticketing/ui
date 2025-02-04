<script lang="ts">
	import { t } from 'svelte-i18n';

	let activeIndex: number | null = null;
	function toggle(index: number): void {
		activeIndex = activeIndex === index ? null : index;
	}

	type FAQItem = {
		question: string;
		answer: string;
	};

	$: faqs = [
		{
			question: $t('faq.question1'),
			answer: $t('faq.answer1')
		},
		{
			question: $t('faq.question2'),
			answer: $t('faq.answer2')
		},
		{
			question: $t('faq.question3'),
			answer: $t('faq.answer3')
		},
		{
			question: $t('faq.question4'),
			answer: $t('faq.answer4')
		},
		{
			question: $t('faq.question5'),
			answer: $t('faq.answer5')
		},
		{
			question: $t('faq.question6'),
			answer: $t('faq.answer6')
		},
		{
			question: $t('faq.question7'),
			answer: $t('faq.answer7')
		}
	] as FAQItem[];
</script>

<main>
	<div class="container">
		<h1 class="title">{$t('faq.title')}</h1>
		<div class="content">
			{#each faqs as faq, index}
				<div class="faq-item">
					<button
						class="faq-question"
						on:click={() => toggle(index)}
						on:keydown={(e) => e.key === 'Enter' && toggle(index)}
						aria-expanded={activeIndex === index}
						aria-controls="faq-answer-{index}"
					>
						<span>{faq.question}</span>
						<span class="arrow {activeIndex === index ? 'up' : ''}">▼</span>
					</button>
					<div class="faq-answer {activeIndex === index ? 'active' : ''}">
						{@html faq.answer}
					</div>
				</div>
			{/each}
		</div>
	</div>
</main>

<style>
	/* Angepasste Styles */
	main {
		background-color: #f8f9fa;
		color: #333;
		padding: 2rem;
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
	}
	.container {
		max-width: 1200px;
		margin: auto;
	}
	.title {
		font-size: 2.5rem;
		font-weight: bold;
		text-align: center;
		margin-bottom: 1rem;
		color: #2c3e50;
	}
	.content {
		background: #ffffff;
		border-radius: 12px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		padding: 1.5rem;
	}
	.faq-item {
		margin-bottom: 1rem;
		border-bottom: 1px solid #ddd;
	}
	.faq-question {
		width: 100%;
		display: block;
		text-align: left;
		cursor: pointer;
		padding: 1rem;
		background-color: #2c3e50;
		color: white;
		border-radius: 4px;
		transition: background-color 0.2s ease;
	}
	.faq-question:hover {
		background-color: #e50914;
	}
	.faq-answer {
		padding: 1rem;
		background-color: #fff;
		border-left: 4px solid #e50914;
		display: none;
		animation: fadeIn 0.3s ease-in-out;
	}
	.faq-answer.active {
		display: block;
	}
	.arrow {
		transition: transform 0.3s ease;
	}
	.arrow.up {
		transform: rotate(180deg);
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		main {
			padding: 1rem;
		}
		.title {
			font-size: 2rem;
		}
		.faq-question {
			flex-direction: column;
			align-items: flex-start;
		}
		.arrow {
			margin-top: 0.5rem;
		}
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
