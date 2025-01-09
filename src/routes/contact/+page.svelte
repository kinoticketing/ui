<script>
    // @ts-ignore
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
  
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
  
      // Formularvalidierung (einfaches Beispiel)
      if (!$name || !$email || !$subject || !$message) {
        errorMessage.set('Bitte füllen Sie alle Felder aus.');
        isSubmitting.set(false);
        return;
      }
  
      try {
        // Beispiel: Senden der Daten an einen API-Endpunkt
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: $name, email: $email, subject: $subject, message: $message })
        });
  
        if (response.ok) {
          successMessage.set('Ihre Nachricht wurde erfolgreich gesendet. Wir werden uns bald bei Ihnen melden.');
          // Formular zurücksetzen
          name.set('');
          email.set('');
          subject.set('');
          message.set('');
        } else {
          errorMessage.set('Es gab ein Problem beim Senden Ihrer Nachricht. Bitte versuchen Sie es später erneut.');
        }
      } catch (error) {
        errorMessage.set('Es gab ein Problem beim Senden Ihrer Nachricht. Bitte versuchen Sie es später erneut.');
        console.error(error);
      } finally {
        isSubmitting.set(false);
      }
    }
  </script>
  
  <style>
    .contact-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #333;
      background-color: #f9f9f9;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
  
    h1 {
      text-align: center;
      color: #e50914; /* Filmischer Rotton */
      margin-bottom: 1.5rem;
    }
  
    form {
      display: flex;
      flex-direction: column;
    }
  
    label {
      margin-bottom: 0.5rem;
      font-weight: bold;
    }
  
    input, textarea {
      padding: 0.75rem;
      margin-bottom: 1rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 1rem;
      resize: vertical;
    }
  
    button {
      padding: 0.75rem;
      background-color: #e50914;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }
  
    button:hover {
      background-color: #c40712;
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
  
    .contact-info {
      margin-top: 2rem;
    }
  
    .contact-info h2 {
      color: #222;
      margin-bottom: 1rem;
      border-bottom: 2px solid #e50914;
      padding-bottom: 0.5rem;
    }
  
    .contact-details p {
      margin: 0.5rem 0;
    }
  
    /* Responsive Design */
    @media (max-width: 600px) {
      .contact-container {
        padding: 1rem;
      }
  
      h1 {
        font-size: 1.8rem;
      }
  
      h2 {
        font-size: 1.4rem;
      }
    }
  
    /* Karten-Styles */
    .map-container {
      margin-top: 2rem;
      height: 300px;
      width: 100%;
      border-radius: 8px;
      overflow: hidden;
    }
  
    iframe {
      border: 0;
      width: 100%;
      height: 100%;
    }
  </style>
  
  <div class="contact-container">
    <h1>Kontaktieren Sie uns</h1>
  
    <form on:submit={handleSubmit}>
      <div class="messages">
        {#if $successMessage}
          <p class="success">{$successMessage}</p>
        {/if}
        {#if $errorMessage}
          <p class="error">{$errorMessage}</p>
        {/if}
      </div>
  
      <label for="name">Name</label>
      <input
        type="text"
        id="name"
        bind:value={$name}
        placeholder="Ihr Name"
        required
      />
  
      <label for="email">E-Mail</label>
      <input
        type="email"
        id="email"
        bind:value={$email}
        placeholder="Ihre E-Mail-Adresse"
        required
      />
  
      <label for="subject">Betreff</label>
      <input
        type="text"
        id="subject"
        bind:value={$subject}
        placeholder="Betreff Ihrer Nachricht"
        required
      />
  
      <label for="message">Nachricht</label>
      <textarea
        id="message"
        bind:value={$message}
        placeholder="Ihre Nachricht"
        rows="5"
        required
      ></textarea>
  
      <button type="submit" disabled={$isSubmitting}>
        {#if $isSubmitting}
          Senden...
        {:else}
          Senden
        {/if}
      </button>
    </form>
  
    <div class="contact-info">
      <h2>Unsere Kontaktdaten</h2>
      <div class="contact-details">
        <p><strong>Adresse:</strong> [Straße und Hausnummer], [PLZ und Ort]</p>
        <p><strong>Telefon:</strong> <a href="tel:+491234567890">+49 123 456 7890</a></p>
        <p><strong>E-Mail:</strong> <a href="mailto:support@deinedomain.com">support@deinedomain.com</a></p>
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
  