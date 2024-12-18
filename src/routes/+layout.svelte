<script>
	// @ts-nocheck ???
  

	import '../app.css';
	import Icon from '@iconify/svelte';
	import { fade } from 'svelte/transition';
  import { onMount } from 'svelte';

	const currentYear = new Date().getFullYear();
	const isSignedIn = false; // HAS TO BE SET DYNAMICALLY; HARDCODED FOR TESTING PURPOSES
	let companyName = 'Kinoticketreservierungssystem';
	let showMenu = false;

	function toggleMenu() {
		showMenu = !showMenu;
	}

	/**
	 * @param {{ target: { closest: (arg0: string) => any; }; }} event
	 */
	function handleClickOutside(event) {
		if (showMenu && !event.target.closest('.account-dropdown')) {
			showMenu = false;
		}
	}
  
</script>

<svelte:window on:click={handleClickOutside} />

<header>
	<nav>
		<div class="logo-and-links">
			<h1>{companyName}</h1>
			<ul>
				<li>
          <a class="link dark" href="/">
            <Icon icon="mdi:home" width="24" height="24" />
            <div class="navbarItemText">Home</div>
          </a>
        </li>
        <li>
          <a class="link dark" href="/movies">
            <Icon icon="mdi:movie" width="24" height="24" />
            <div class="navbarItemText">Movies</div>
          </a>
        </li>
        <li>
          <a class="link dark" href="/reservations">
            <Icon icon="mdi:ticket" width="24" height="24" />
            <div class="navbarItemText">Reservations</div>
          </a>
        </li>
        <li>
          <a class="link dark" href="/about">
            <Icon icon="mdi:information" width="24" height="24" />
            <div class="navbarItemText">About</div>
          </a>
        </li>
			</ul>
		</div>
		<div class="search-and-account">
      <input 
        type="text" 
        class="search-input" 
        placeholder="Suche..."
      />
			<div class="account-dropdown">
				<button class="account-icon" on:click={toggleMenu}>
					<Icon icon="mdi:account-circle" width="38" height="38" />
				</button>
				{#if showMenu}
					<div class="dropdown-menu" transition:fade={{ duration: 100 }}>
						<ul>
							<li>
								<a href="/settings">
									<Icon icon="mdi:cog" />
									Settings
								</a>
							</li>
							<li>
								{#if isSignedIn}
									<a href="/account">
										<Icon icon="mdi:account" />
										Account
									</a>
								{:else}
									<a href="/auth/login">
										<Icon icon="mdi:login" />
										Sign In
									</a>
								{/if}
							</li>
						</ul>
					</div>
				{/if}
			</div>
		</div>
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
				<!-- svelte-ignore a11y-invalid-attribute -->
				<a class="icon-link" href="#" aria-label="Facebook">
					<Icon icon="logos:facebook" width=24px height=24px/>
				</a>
				<!-- svelte-ignore a11y-invalid-attribute -->
				<a class="icon-link" href="#" aria-label="X (Twitter)">
					<Icon icon="devicon:twitter" width=24px height=24px/>
				</a>
				<!-- svelte-ignore a11y-invalid-attribute -->
				<a class="icon-link" href="#" aria-label="Instagram">
					<Icon icon="skill-icons:instagram" width=24px height=24px/>
				</a>
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
	/* Header and Navigation */

  .navbarItemText {
    margin-left: 8px;
  }

  .logo-and-links a {
		display: flex;
		align-items: center;
    white-space: nowrap;
    border: 1px solid white;
    border-radius: 10px;
    padding: 8px;
	}

  

  .logo-and-links a:hover {
    background-color: #f1f1f1;
    color: #333;
    text-decoration: none;
  }

  .logo-and-links a:active {
    background-color: #cecece;
    border-color: #cecece;
  }

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
		font-size: 1rem;
	}

	nav ul li a {
		color: #fff;
		text-decoration: none;
		font-size: 1rem;
	}

	.link {
		text-decoration: none;
		color: #333;
	}

	nav ul li a:hover {
		text-decoration: underline;
	}

	.link:hover {
		text-decoration: underline;
	}

	.dark {
		color: #fff;
	}

	nav input {
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
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
		display: flex;
		flex-direction: column;
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

	.social-icons {
		display: flex;
		justify-content: flex-start; /* Change from center to flex-start */
		gap: 20px;
		margin-top: 10px; /* Add some space between the heading and icons */
	}

	.icon-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px; /* Adjust size as needed */
		height: 40px; /* Adjust size as needed */
		color: #000; /* Adjust color as needed */
		transition: color 0.3s ease;
	}

	.icon-link:hover {
		color: #555; /* Adjust hover color as needed */
	}

	.footer-section form {
		display:inline-block;
		gap: 0.5rem;
	}

	.footer-section form input {
		padding: 0.5rem;
		flex: 1;
		border: 1px solid #ccc;
		border-radius: 4px;
    margin-bottom: 4px;
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

	footer p {
		margin: 0;
		color: #555;
	}

	/* Account Icon */
	.search-and-account {
		display: flex;
		align-items: center;
		gap: 1rem;
    flex: 1;
      justify-content: flex-end; /* Align to the right when there's extra space */

	}

	.search-input {
    flex: 1;
    width: 100%;
    min-width: 58px; /* Minimum usable width */
    max-width: 300px; /* Maximum width for readability */
		padding: 0.5rem 1rem;
		border: 1px solid #ddd;
		border-radius: 20px;
		font-size: 1rem;
    margin-left: 10px;
	}

  @media screen and (max-width: 1050px) {
    .navbarItemText {
      display: none;
    }
    
    .logo-and-links a {
      padding: 8px;
      justify-content: center;
    }

    .search-input {
      max-width: 58px;
    }
  }

	.account-dropdown {
		position: relative;
    flex-shrink: 0; /* Prevent the dropdown from shrinking */
	}

	.account-icon {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
    color: white;
    display: flex;
    align-items: center;
    width: 40px;
    height: 40px;
	}

	.dropdown-menu {
		position: absolute;
		right: 0;
		top: 100%;
		background: white;
		border-radius: 8px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		min-width: 200px;
		z-index: 10;
		overflow: hidden; /* This will clip the hover effect to the rounded corners */
	}

	.dropdown-menu ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
	}

	.dropdown-menu li {
		width: 100%;
	}

	.dropdown-menu li a {
		display: flex;
		align-items: center;
		padding: 0.75rem 1rem;
		color: #333;
		text-decoration: none;
		transition: background-color 0.2s;
		width: 100%;
	}

	.dropdown-menu li:first-child a {
		border-top-left-radius: 8px;
		border-top-right-radius: 8px;
	}

	.dropdown-menu li:last-child a {
		border-bottom-left-radius: 8px;
		border-bottom-right-radius: 8px;
	}

	.dropdown-menu li a:hover {
		background-color: #f0f0f0;
	}

	.dropdown-menu :global(svg) {
		margin-right: 0.5rem;
	}

  

	

  
</style>
