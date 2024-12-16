<script>
  import "../app.css";
  import "./layout.css";
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
          <li><a class="link" href="#"><img src="/img/facebook-icon.png" alt="Facebook Logo" />Facebook</a></li>
          <li><a class="link" href="#"><img src="/img/x-icon.png" alt="X Logo" />X</a></li>
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
