<script>
    // Definition der FAQ-Daten
    const faqs = [
      {
        question: "Wie buche ich ein Ticket?",
        answer: `
          <p>Um ein Ticket zu buchen, wählen Sie zuerst den gewünschten Film und die gewünschte Vorstellung aus. Anschließend können Sie die verfügbaren Plätze auswählen und Ihre Reservierung abschließen.</p>
        `
      },
      {
        question: "Welche Zahlungsmethoden werden akzeptiert?",
        answer: `
          <p>Wir akzeptieren verschiedene Zahlungsmethoden, darunter Kreditkarten (Visa, MasterCard, American Express), PayPal und Sofortüberweisung.</p>
        `
      },
      {
        question: "Kann ich meine Buchung stornieren?",
        answer: `
          <p>Ja, Sie können Ihre Buchung bis zu 24 Stunden vor der Vorstellung kostenfrei stornieren. Bitte besuchen Sie unsere <a href="/refund-policy">Rückerstattungsseite</a> für weitere Informationen.</p>
        `
      },
      {
        question: "Gibt es Ermäßigungen für Studenten oder Senioren?",
        answer: `
          <p>Ja, wir bieten Ermäßigungen für Studenten, Senioren und Kinder an. Bitte legen Sie bei der Buchung einen gültigen Ausweis vor.</p>
        `
      },
      {
        question: "Wie erhalte ich meine Tickets?",
        answer: `
          <p>Nach der Buchung können Sie Ihre Tickets entweder per E-Mail erhalten oder direkt am Kinosaal abholen. Wählen Sie die bevorzugte Option während des Buchungsvorgangs aus.</p>
        `
      },
      {
        question: "Bietet ihr Gruppentarife an?",
        answer: `
          <p>Ja, wir bieten spezielle Tarife für Gruppen ab 10 Personen an. Bitte kontaktieren Sie unseren <a href="/contact">Kundensupport</a> für weitere Informationen.</p>
        `
      },
      {
        question: "Wie kontaktiere ich den Kundensupport?",
        answer: `
          <p>Sie können unseren Kundensupport über das <a href="/contact">Kontaktformular</a>, per E-Mail an <a href="mailto:support@deinedomain.com">support@deinedomain.com</a> oder telefonisch unter +49 123 456 7890 erreichen.</p>
        `
      },
      // Weitere FAQs können hier hinzugefügt werden
    ];
  
    // Zustandsverwaltung für das aktive Accordion
    let activeIndex = null;
  
    function toggle(index) {
      activeIndex = activeIndex === index ? null : index;
    }
  </script>
  
  <style>
    .faq-container {
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
      background-color: #e50914;
      color: white;
      border-radius: 4px;
    }
  
    .faq-question:hover {
      background-color: #c40712;
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
  
    a {
      color: #e50914;
      text-decoration: none;
    }
  
    a:hover {
      text-decoration: underline;
    }
  
    /* Responsive Design */
    @media (max-width: 600px) {
      .faq-container {
        padding: 1rem;
      }
  
      h1 {
        font-size: 1.8rem;
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
      from { opacity: 0; }
      to { opacity: 1; }
    }
  </style>
  
  <div class="faq-container">
    <h1>Häufig gestellte Fragen (FAQ)</h1>
  
    {#each faqs as faq, index}
      <div class="faq-item">
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
  