<script>
  import "../app.css";
  const currentYear = new Date().getFullYear();
  let companyName = "Kinoticketreservierungssystem";
</script>

<header>
  <nav>
    <div class="logo-and-links">
      <h1>{companyName}</h1>
      <ul>
        <li><a class="link dark" href="/">Home</a></li>
        <li><a class="link dark" href="/movies">Movies</a></li>
        <li><a class="link dark" href="/reservations">Reservations</a></li>
        <li><a class="link dark" href="/about">About</a></li>
      </ul>
    </div>
    <input type="text" placeholder="Suche..." />
  </nav>
</header>

<main>
  <slot />
</main>

<footer>
  <div class="footer-content">
    <div class="footer-section">
      <h2><a class="link" href="/about">About Us</a></h2>
      <p>Your go-to platform for reserving movie tickets quickly and easily.</p>
    </div>

    <div class="footer-section">
      <h2>Quick Links</h2>
      <ul>
        <li><a class="link" href="/terms">Terms of Service</a></li>
        <li><a class="link" href="/privacy">Privacy Policy</a></li>
        <li><a class="link" href="/contact">Contact</a></li>
        <li><a class="link" href="/faq">FAQ</a></li>
      </ul>
    </div>

    <div class="footer-section">
      <h2>Follow Us</h2>
      <div class="social-icons">
        <ul>
          <!-- svelte-ignore a11y-invalid-attribute -->
          <li><a class="link" href="#"><img src="/img/facebook-icon.png" alt="Facebook Logo" />Facebook</a></li>
          <!-- svelte-ignore a11y-invalid-attribute -->
          <li><a class="link" href="#"><img src="/img/x-icon.png" alt="X Logo" />X</a></li>
          <!-- svelte-ignore a11y-invalid-attribute -->
          <li><a class="link" href="#"><img src="/img/instagram-icon.png" alt="Instagram Logo" />Instagram</a></li>
        </ul>
      </div>
    </div>

    <div class="footer-section">
      <h2>Newsletter</h2>
      <form>
        <input type="email" placeholder="Your email" />
        <button type="submit">Subscribe</button>
      </form>
    </div>
  </div>

  <div class="footer-bottom">
    <p>© {companyName} {currentYear}. All rights reserved.</p>
  </div>
</footer>

<style>
  header {
    background-color: #333;
    color: #fff;
    padding: 1rem;
  }

  nav {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
  }

  .logo-and-links {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
  }

  nav h1 {
    margin: 0;
    font-size: 1.5rem;
  }

  nav ul {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin: 0;
    padding: 0;
    font-size: 1rem;
  }


  .link {
    text-decoration: none;
    color: #333;
  }

  .link:hover {
    text-decoration: underline;
  }

  .dark{
    color: #fff;
  }


  nav input {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    margin-top: 1rem;
    flex: 1 1 auto;
  }

  @media (min-width: 600px) {
    nav input {
      margin-top: 0;
      flex: 0 1 200px;
    }
  }

  @media (max-width: 600px) {
    nav ul {
      flex-direction: column;
      align-items: flex-start;
    }

    nav input {
      width: 100%;
    }
  }

  /* Main Content Section */
  main {
    padding: 1rem;
    min-height: calc(100vh - 200px); /* Adjusted for larger footer */
  }

  /* Footer */
  footer {
    background-color: #f1f1f1;
    color: #555;
    padding: 2rem;
    margin-top: 2rem;
    font-size: 0.9rem;
  }

  .footer-content {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 2rem;
  }

  .footer-section {
    flex: 1 1 200px;
    min-width: 200px;
  }

  .footer-section h2 {
    margin-bottom: 1rem;
    font-size: 1.2rem;
    color: #333;
  }

  .footer-section ul {
    list-style: none;
    padding: 0;
  }

  .footer-section ul li {
    margin-bottom: 0.5rem;
  }

  .social-icons a {
    margin-right: 1rem;
    display: inline-block;
  }

  .social-icons img {
    width: 24px;
    height: 24px;
  }

  .footer-section form {
    display: flex;
    gap: 0.5rem;
  }

  .footer-section form input {
    padding: 0.5rem;
    flex: 1;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  .footer-section form button {
    padding: 0.5rem 1rem;
    background-color: #333;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .footer-section form button:hover {
    background-color: #555;
  }

  .footer-bottom {
    text-align: center;
    margin-top: 2rem;
    border-top: 1px solid #ccc;
    padding-top: 1rem;
  }

  .social-icons img {
          margin-right: 10px;
        }

.social-icons a {
          display: flex;
      align-items: center;
}
</style>