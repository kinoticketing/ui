<script>
	// @ts-ignore
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import '../../i18n.js';
	import { t } from 'svelte-i18n';

	// Zustandsverwaltung für das Formular
	const name = writable('');
	const email = writable('');
	const subject = writable('');
	const message = writable('');
	const successMessage = writable('');
	const errorMessage = writable('');
	const isSubmitting = writable(false);

	// Funktion zum Senden des Formulars
	// @ts-ignore
	async function handleSubmit(event) {
		event.preventDefault();
		isSubmitting.set(true);
		successMessage.set('');
		errorMessage.set('');

		// Simple validation
		if (!name || !email || !subject || !message) {
			errorMessage.set($t('contact.fillAllFields'));
			isSubmitting.set(false);
			return;
		}

		try {
			const response = await fetch('/api/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: name,
					email: email,
					subject: subject,
					message: message
				})
			});

			if (response.ok) {
				successMessage.set($t('contact.messageSentSuccess'));
				// Reset form
				name.set('');
				email.set('');
				subject.set('');
				message.set('');
			} else {
				errorMessage.set($t('contact.messageSendError'));
			}
		} catch (err) {
			errorMessage.set($t('contact.messageSendError'));
			console.error(err);
		} finally {
			isSubmitting.set(false);
		}
	}
</script>

<main>
	<div class="container">
		<!-- Was: <h1 class="title">Kontaktieren Sie uns</h1> -->
		<h1 class="title">{$t('contact.contactUs')}</h1>

		<div class="content">
			<form on:submit={handleSubmit}>
				<div class="messages">
					{#if $successMessage}
						<!-- Was: <p class="success">{$successMessage}</p> -->
						<p class="success">{$t('contact.successMessage')}</p>
					{/if}
					{#if $errorMessage}
						<!-- Was: <p class="error">{$errorMessage}</p> -->
						<p class="error">{$t('contact.errorMessage')}</p>
					{/if}
				</div>

				<div class="form-group">
					<!-- Was: <label for="name">Name</label> -->
					<label for="name">{$t('contact.nameLabel')}</label>
					<!-- Was: placeholder="Ihr Name" -->
					<input
						type="text"
						id="name"
						bind:value={$name}
						placeholder={$t('contact.namePlaceholder')}
						required
					/>
				</div>

				<div class="form-group">
					<!-- Was: <label for="email">E-Mail</label> -->
					<label for="email">{$t('contact.emailLabel')}</label>
					<!-- Was: placeholder="Ihre E-Mail-Adresse" -->
					<input
						type="email"
						id="email"
						bind:value={$email}
						placeholder={$t('contact.emailPlaceholder')}
						required
					/>
				</div>

				<div class="form-group">
					<!-- Was: <label for="subject">Betreff</label> -->
					<label for="subject">{$t('contact.subjectLabel')}</label>
					<!-- Was: placeholder="Betreff Ihrer Nachricht" -->
					<input
						type="text"
						id="subject"
						bind:value={$subject}
						placeholder={$t('contact.subjectPlaceholder')}
						required
					/>
				</div>

				<div class="form-group">
					<!-- Was: <label for="message">Nachricht</label> -->
					<label for="message">{$t('contact.messageLabel')}</label>
					<!-- Was: placeholder="Ihre Nachricht" -->
					<textarea
						id="message"
						bind:value={$message}
						placeholder={$t('contact.messagePlaceholder')}
						rows="5"
						required
					></textarea>
				</div>

				<!-- Conditionally switch the button text -->
				<button type="submit" disabled={$isSubmitting}>
					{#if $isSubmitting}
						{$t('contact.sendingButton')}
					{:else}
						{$t('contact.sendButton')}
					{/if}
				</button>
			</form>

			<div class="contact-info">
				<!-- Was: <h2>Unsere Kontaktdaten</h2> -->
				<h2>{$t('contact.ourContactDetails')}</h2>

				<div class="contact-details">
					<!-- Was: <p><strong>Adresse:</strong> [Straße und Hausnummer]... -->
					<p>
						<strong>{$t('contact.addressColon')}</strong> [Straße und Hausnummer], [PLZ und Ort]
					</p>

					<!-- Was: <p><strong>Telefon:</strong> -->
					<p>
						<strong>{$t('contact.phoneColon')}</strong>
						<a href="tel:+491234567890">+49 123 456 7890</a>
					</p>

					<!-- Was: <p><strong>E-Mail:</strong> -->
					<p>
						<strong>{$t('contact.emailColon')}</strong>
						<a href="mailto:support@deinedomain.com">support@deinedomain.com</a>
					</p>
				</div>
			</div>

			<div class="map-container">
				<!-- Beispielhafte Einbettung einer Google Map -->
				<!-- svelte-ignore a11y-missing-attribute -->
				<iframe
					src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2436.123456789!2d13.4050!3d52.5200!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47a851xxxxxxx%3A0x123456789abcdef!2sDein%20Firmenname!5e0!3m2!1sde!2sde!4v1600000000000!5m2!1sde!2sde"
					allowfullscreen
					loading="lazy"
				></iframe>
			</div>
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
	form {
		display: flex;
		flex-direction: column;
	}
	.form-group {
		display: flex;
		flex-direction: column;
		margin-bottom: 1rem;
	}
	label {
		font-weight: bold;
		margin-bottom: 0.5rem;
	}
	input,
	textarea {
		padding: 0.75rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 1rem;
		resize: vertical;
	}
	button {
		padding: 0.75rem;
		background-color: #2c3e50;
		color: #ffffff;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}
	button:hover {
		background-color: #e50914;
	}
	.messages {
		margin-bottom: 1rem;
	}
	.success {
		color: green;
	}
	.error {
		color: red;
	}
	h2 {
		font-size: 2rem;
		color: #2c3e50;
		margin-bottom: 1rem;
	}
	.contact-details p {
		margin: 0.5rem 0;
		line-height: 1.6;
	}
	.contact-details a {
		color: #2c3e50;
		text-decoration: none;
		transition: color 0.2s ease;
	}
	.contact-details a:hover {
		color: #e50914;
		text-decoration: underline;
	}
	.map-container {
		margin-top: 2rem;
		height: 300px;
		width: 100%;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
	iframe {
		border: 0;
		width: 100%;
		height: 100%;
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
