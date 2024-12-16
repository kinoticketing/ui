<script>
	// @ts-nocheck ???

	import '../app.css';
	import Icon from '@iconify/svelte';
	import { fade } from 'svelte/transition';

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
				<li><a href="/">Home</a></li>
				<li><a href="/movies">Movies</a></li>
				<li><a href="/reservations">Reservations</a></li>
				<li><a href="/about">About</a></li>
			</ul>
		</div>
		<div class="search-and-account">
			<input type="text" placeholder="Suche..." class="search-input" />
			<div class="account-dropdown">
				<button class="account-icon" on:click={toggleMenu}>
					<Icon icon="mdi:account-circle" width="24" height="24" />
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
		min-height: calc(100vh - 120px); /* Adjust based on header and footer height */
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

	/* Account Icon */
  .search-and-account {
display: flex;
align-items: center;
gap: 1rem;
}

.search-input {
padding: 0.5rem 1rem;
border: 1px solid #ddd;
border-radius: 20px;
font-size: 1rem;
}

.account-dropdown {
position: relative;
}

.account-icon {
background: none;
border: none;
cursor: pointer;
padding: 0;
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
