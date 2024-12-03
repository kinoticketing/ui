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
        <li><a href="/">Home</a></li>
        <li><a href="/movies">Movies</a></li>
        <li><a href="/reservations">Reservations</a></li>
        <li><a href="/about">About</a></li>
      </ul>
    </div>
    <input type="text" placeholder="Suche..." />
  </nav>
</header>

<main>
  <slot />
</main>

<footer>
  <p>© {companyName} {currentYear}</p>
</footer>

<style>
  /* Header and Navigation */
  header {
    background-color: #333;
    color: #fff;
    padding: 1rem;
  }

  nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo-and-links {
    display: flex;
    align-items: center;
  }

  nav h1 {
    margin: 0;
    font-size: 1.5rem;
    margin-right: 2rem;
  }

  nav ul {
    list-style: none;
    display: flex;
    gap: 1rem;
    margin: 0;
    padding: 0;
  }

  nav ul li a {
    color: #fff;
    text-decoration: none;
    font-size: 1rem;
  }

  nav ul li a:hover {
    text-decoration: underline;
  }

  nav input {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  /* Main Content Section */
  main {
    padding: 1rem;
    min-height: calc(
      100vh - 120px
    ); /* Adjust based on header and footer height */
  }

  /* Footer */
  footer {
    background-color: #f1f1f1;
    text-align: center;
    padding: 1rem;
    position: relative;
    bottom: 0;
    width: 100%;
  }

  footer p {
    margin: 0;
    color: #555;
  }
</style>
