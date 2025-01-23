<script>
	// Definition der FAQ-Daten
	const faqs = [
		{
			question: 'Wie buche ich ein Ticket?',
			answer: `
  <p>Um ein Ticket zu buchen, wählen Sie zuerst den gewünschten Film und die gewünschte Vorstellung aus. Anschließend können Sie die verfügbaren Plätze auswählen und Ihre Reservierung abschließen.</p>
  `
		},
		{
			question: 'Welche Zahlungsmethoden werden akzeptiert?',
			answer: `
  <p>Wir akzeptieren verschiedene Zahlungsmethoden, darunter Kreditkarten (Visa, MasterCard, American Express), PayPal und Sofortüberweisung.</p>
  `
		},
		{
			question: 'Kann ich meine Buchung stornieren?',
			answer: `
  <p>Ja, Sie können Ihre Buchung bis zu 24 Stunden vor der Vorstellung kostenfrei stornieren.</p>
  `
		},
		{
			question: 'Gibt es Ermäßigungen für Studenten oder Senioren?',
			answer: `
  <p>Ja, wir bieten Ermäßigungen für Studenten, Senioren und Kinder an. Bitte legen Sie bei der Buchung einen gültigen Ausweis vor.</p>
  `
		},
		{
			question: 'Wie erhalte ich meine Tickets?',
			answer: `
  <p>Nach der Buchung können Sie Ihre Tickets entweder per E-Mail erhalten oder direkt am Kinosaal abholen. Wählen Sie die bevorzugte Option während des Buchungsvorgangs aus.</p>
  `
		},
		{
			question: 'Bietet ihr Gruppentarife an?',
			answer: `
  <p>Ja, wir bieten spezielle Tarife für Gruppen ab 10 Personen an. Bitte kontaktieren Sie unseren <a href="/contact">Kundensupport</a> für weitere Informationen.</p>
  `
		},
		{
			question: 'Wie kontaktiere ich den Kundensupport?',
			answer: `
  <p>Sie können unseren Kundensupport über das <a href="/contact">Kontaktformular</a>, per E-Mail an <a href="mailto:support@deinedomain.com">support@deinedomain.com</a> oder telefonisch unter +49 123 456 7890 erreichen.</p>
  `
		}
		// Weitere FAQs können hier hinzugefügt werden
	];

	// Zustandsverwaltung für das aktive Accordion
	// @ts-ignore
	/**
	 * @type {number | null}
	 */
	let activeIndex = null;

	// @ts-ignore
	function toggle(index) {
		// @ts-ignore
		activeIndex = activeIndex === index ? null : index;
	}
</script>

<main>
	<div class="container">
		<h1 class="title">Häufig gestellte Fragen (FAQ)</h1>

		<div class="content">
			{#each faqs as faq, index}
				<div class="faq-item">
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<div class="faq-question" on:click={() => toggle(index)}>
						<span>{faq.question}</span>
						<span class="arrow {activeIndex === index ? 'up' : ''}">▼</span>
					</div>
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
		display: flex;
		justify-content: space-between;
		align-items: center;
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
