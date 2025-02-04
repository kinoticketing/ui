<script>
	import '../../i18n.js';
	import { t } from 'svelte-i18n';
</script>

<main>
	<div class="container">
		<!-- Header -->
		<h1 class="title">{$t('privacyPolicy.title')}</h1>

		<div class="content">
			<section>
				<h2>{$t('privacyPolicy.section1.title')}</h2>
				<p>{$t('privacyPolicy.section1.text')}</p>
			</section>

			<section>
				<h2>{$t('privacyPolicy.section2.title')}</h2>
				<p>{$t('privacyPolicy.section2.text')}</p>
				<p>{$t('privacyPolicy.section2.companyInfo')}</p>
			</section>

			<section>
				<h2>{$t('privacyPolicy.section3.title')}</h2>
				<p>{$t('privacyPolicy.section3.intro')}</p>
				<ul>
					{#each $t('privacyPolicy.section3.list1') as item}
						<li>{item}</li>
					{/each}
				</ul>
				<p>{$t('privacyPolicy.section3.text2')}</p>
				<ul>
					{#each $t('privacyPolicy.section3.list2') as item}
						<li>{item}</li>
					{/each}
				</ul>
			</section>

			<section>
				<h2>{$t('privacyPolicy.section4.title')}</h2>
				<p>{$t('privacyPolicy.section4.intro')}</p>
				<ul>
					{#each $t('privacyPolicy.section4.list') as item}
						<li>{item}</li>
					{/each}
				</ul>
			</section>

			<section>
				<h2>{$t('privacyPolicy.section5.title')}</h2>
				<p>{$t('privacyPolicy.section5.intro')}</p>
				<ul>
					{#each $t('privacyPolicy.section5.list') as item}
						<li>{item}</li>
					{/each}
				</ul>
			</section>

			<section>
				<h2>{$t('privacyPolicy.section6.title')}</h2>
				<p>{$t('privacyPolicy.section6.text')}</p>
			</section>

			<section>
				<h2>{$t('privacyPolicy.section7.title')}</h2>
				<p>{$t('privacyPolicy.section7.intro')}</p>
				<ul>
					{#each $t('privacyPolicy.section7.list') as item}
						<li>{item}</li>
					{/each}
				</ul>
				<p>{$t('privacyPolicy.section7.text')}</p>
			</section>

			<section>
				<h2>{$t('privacyPolicy.section8.title')}</h2>
				<p>{$t('privacyPolicy.section8.text')}</p>
			</section>

			<section>
				<h2>{$t('privacyPolicy.section9.title')}</h2>
				<p>{$t('privacyPolicy.section9.text')}</p>
			</section>

			<section>
				<h2>{$t('privacyPolicy.section10.title')}</h2>
				<p>{$t('privacyPolicy.section10.text')}</p>
			</section>
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
	h2 {
		font-size: 2rem;
		color: #2c3e50;
		margin-bottom: 1rem;
	}
	p {
		margin: 1rem 0;
		line-height: 1.6;
	}
	ul {
		list-style-type: disc;
		margin-left: 2rem;
		line-height: 1.6;
	}
	a {
		color: #2c3e50;
		text-decoration: none;
		transition: color 0.2s ease;
	}
	a:hover {
		color: #e50914;
		text-decoration: underline;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		main {
			padding: 1rem;
		}
		.title {
			font-size: 2rem;
		}
		h2 {
			font-size: 1.5rem;
		}
	}
</style>
