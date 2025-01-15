<script lang="ts">
	import '../app.css';
	import Icon from '@iconify/svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { signIn, signOut } from '@auth/sveltekit/client';
	import { goto } from '$app/navigation';
	import '../i18n.js';
	import { t, locale } from 'svelte-i18n';
	import { i18nReady } from '../i18n.js';

	let loaded = false;
	onMount(async () => {
		await i18nReady;
		loaded = true;
	});

	const currentYear = new Date().getFullYear();
	let showMenu = false;
	let isScrolled = false;

	function toggleMenu() {
		showMenu = !showMenu;
	}

	function handleClickOutside(event: MouseEvent) {
		if (showMenu && !(event.target as HTMLElement).closest('.account-dropdown')) {
			showMenu = false;
		}
	}

	async function handleLogout() {
		try {
			await signOut();
			await goto('/auth/login');
		} catch (error) {
			console.error('Logout error:', error);
		}
	}

	// Add scroll listener for header transparency
	onMount(() => {
		window.addEventListener('scroll', () => {
			isScrolled = window.scrollY > 20;
		});
	});
</script>

<svelte:window on:click={handleClickOutside} />
{#if loaded}
	<header class:scrolled={isScrolled}>
		<nav>
			<div class="nav-content">
				<a href="/" class="logo">
					<img src="/logo.png" alt={$t('layout.logo.alt')} />
					<span>{$t('layout.logo.text')}</span>
				</a>

				<div class="nav-links">
					<a href="/" class="nav-link" class:active={$page.url.pathname === '/'}>
						<Icon icon="mdi:home" width="24" height="24" />
						<span>{$t('layout.nav.home')}</span>
					</a>
					<a href="/movies" class="nav-link" class:active={$page.url.pathname.includes('/movies')}>
						<Icon icon="mdi:movie" width="24" height="24" />
						<span>{$t('layout.nav.movies')}</span>
					</a>
					<a
						href="/reservations"
						class="nav-link"
						class:active={$page.url.pathname.includes('/reservations')}
					>
						<Icon icon="mdi:ticket" width="24" height="24" />
						<span>{$t('layout.nav.reservations')}</span>
					</a>
					<a href="/about" class="nav-link" class:active={$page.url.pathname === '/about'}>
						<Icon icon="mdi:information" width="24" height="24" />
						<span>{$t('layout.nav.about')}</span>
					</a>
				</div>

				<div class="language-selector">
					<button class="lang-btn" class:active={$locale === 'en'} on:click={() => locale.set('en')}
						>EN</button
					>
					<button class="lang-btn" class:active={$locale === 'de'} on:click={() => locale.set('de')}
						>DE</button
					>
				</div>

				<div class="account-dropdown">
					<button class="account-button" on:click={toggleMenu}>
						<Icon icon="mdi:account-circle" width="32" height="32" />
					</button>

					{#if showMenu}
						<div class="dropdown-menu" transition:fade={{ duration: 200, easing: quintOut }}>
							{#if !$page.data.session?.user}
								<a href="/auth/login" class="dropdown-item">
									<Icon icon="mdi:login" width="20" height="20" />
									<span>{$t('layout.account.signIn')}</span>
								</a>
							{:else}
								<a href="/auth/account" class="dropdown-item">
									<Icon icon="mdi:account-circle-outline" width="20" height="20" />
									<span>{$t('layout.account.myAccount')}</span>
								</a>
								<a href="/settings" class="dropdown-item">
									<Icon icon="mdi:cog" width="20" height="20" />
									<span>{$t('layout.account.settings')}</span>
								</a>
								<button class="dropdown-item logout" on:click={handleLogout}>
									<Icon icon="mdi:logout" width="20" height="20" />
									<span>{$t('layout.account.signOut')}</span>
								</button>
							{/if}
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
				<h2>{$t('layout.footer.aboutUs.title')}</h2>
				<p>{$t('layout.footer.aboutUs.description')}</p>
			</div>

			<div class="footer-section">
				<h2>{$t('layout.footer.quickLinks.title')}</h2>
				<div class="footer-links">
					<a href="/terms">{$t('layout.footer.quickLinks.terms')}</a>
					<a href="/privacy">{$t('layout.footer.quickLinks.privacy')}</a>
					<a href="/contact">{$t('layout.footer.quickLinks.contact')}</a>
					<a href="/faq">{$t('layout.footer.quickLinks.faq')}</a>
				</div>
			</div>

			<div class="footer-section">
				<h2>{$t('layout.footer.connect.title')}</h2>
				<div class="social-links">
					<a href="#" class="social-link" aria-label={$t('layout.footer.connect.facebook')}>
						<Icon icon="mdi:facebook" width="24" height="24" />
					</a>
					<a href="#" class="social-link" aria-label={$t('layout.footer.connect.twitter')}>
						<Icon icon="mdi:twitter" width="24" height="24" />
					</a>
					<a href="#" class="social-link" aria-label={$t('layout.footer.connect.instagram')}>
						<Icon icon="mdi:instagram" width="24" height="24" />
					</a>
				</div>
			</div>

			<div class="footer-section">
				<h2>{$t('layout.footer.newsletter.title')}</h2>
				<form class="newsletter-form" on:submit|preventDefault>
					<input type="email" placeholder={$t('layout.footer.newsletter.placeholder')} required />
					<button type="submit">{$t('layout.footer.newsletter.subscribe')}</button>
				</form>
			</div>
		</div>

		<div class="footer-bottom">
			<p>&copy; {currentYear} Kinoreservierung. {$t('layout.footer.copyright')}</p>
		</div>
	</footer>
{/if}

<style>
	.language-selector {
		display: flex;
		gap: 0.5rem;
		margin-left: 1rem;
	}

	.lang-btn {
		padding: 0.25rem 0.5rem;
		border: 1px solid #e5e7eb;
		border-radius: 0.25rem;
		background: none;
		color: #4b5563;
		cursor: pointer;
		transition: all 0.2s;
	}

	.lang-btn:hover {
		background-color: rgba(0, 0, 0, 0.05);
	}

	.lang-btn.active {
		background-color: #2563eb;
		color: white;
		border-color: #2563eb;
	}
	/* Header Styles */
	header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 1000;
		background-color: rgba(243, 244, 246, 0.95);
		backdrop-filter: blur(8px);
		transition: all 0.3s ease;
	}

	header.scrolled {
		background-color: rgba(243, 244, 246, 0.98);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	nav {
		padding: 1rem 2rem;
	}

	.nav-content {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 1rem;
		text-decoration: none;
		transition: opacity 0.2s;
	}

	.logo:hover {
		opacity: 0.8;
	}

	.logo img {
		height: 40px;
		width: auto;
	}

	.logo span {
		font-family: 'Playfair Display', serif;
		font-size: 1.75rem;
		color: #1a1a1a;
	}

	.nav-links {
		display: flex;
		gap: 1.5rem;
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #4b5563;
		text-decoration: none;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		transition: all 0.2s;
	}

	.nav-link:hover {
		color: #1a1a1a;
		background-color: rgba(0, 0, 0, 0.05);
	}

	.nav-link.active {
		color: #2563eb;
		background-color: rgba(37, 99, 235, 0.1);
	}

	/* Account Dropdown */
	.account-dropdown {
		position: relative;
		display: inline-block;
	}

	.account-button {
		background: none;
		border: none;
		color: #4b5563;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 50%;
		transition: all 0.2s;
	}

	.account-button:hover {
		color: #1a1a1a;
		background-color: rgba(0, 0, 0, 0.05);
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		color: #1f2937;
		text-decoration: none;
		border-radius: 0.5rem;
		transition: all 0.2s;
		cursor: pointer;
		border: none;
		background: none;
		width: calc(100% - 0.5rem); /* Subtract padding to prevent right side overflow */
		text-align: left;
		font-size: 1rem;
		margin: 0.125rem 0.25rem; /* Add horizontal margin to center the items */
		margin-left: 0.25rem;
		margin-right: 0.25rem;
		position: relative;
		overflow: hidden;
	}

	.dropdown-menu {
		position: absolute;
		right: 0;
		top: calc(100% + 0.5rem);
		background: white;
		border-radius: 0.75rem;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
		min-width: 200px;
		padding: 0.5rem;
		max-height: calc(100vh - 5rem);
		overflow-y: auto;
		z-index: 1001;
		/* Add this to ensure consistent padding */
		box-sizing: border-box;
	}

	.dropdown-item:hover {
		background-color: #f3f4f6;
	}

	.dropdown-item.logout {
		color: #ef4444;
	}

	.dropdown-item.logout:hover {
		background-color: #fee2e2;
	}

	/* Main Content */
	main {
		margin-top: 4rem;
		min-height: calc(100vh - 4rem);
	}

	/* Footer Styles */
	footer {
		background-color: #f3f4f6;
		color: #4b5563;
		padding: 4rem 2rem 2rem;
		border-top: 1px solid #e5e7eb;
	}

	.footer-content {
		max-width: 1200px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 3rem;
	}

	.footer-section h2 {
		font-family: 'Playfair Display', serif;
		color: #1a1a1a;
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
	}

	.footer-section p {
		color: #4b5563;
		line-height: 1.6;
	}

	.footer-links {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.footer-links a {
		color: #4b5563;
		text-decoration: none;
		transition: color 0.2s;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.footer-links a:hover {
		color: #2563eb;
	}

	.social-links {
		display: flex;
		gap: 1rem;
	}

	.social-link {
		color: #4b5563;
		transition: all 0.2s;
		padding: 0.75rem;
		border-radius: 50%;
		background-color: white;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.social-link:hover {
		color: #2563eb;
		background-color: white;
		transform: translateY(-2px);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.newsletter-form {
		display: flex;
		gap: 0.5rem;
	}

	.newsletter-form input {
		flex: 1;
		padding: 0.75rem 1rem;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		background-color: white;
		color: #1a1a1a;
		transition: all 0.2s;
	}

	.newsletter-form input:focus {
		outline: none;
		border-color: #2563eb;
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
	}

	.newsletter-form input::placeholder {
		color: #9ca3af;
	}

	.newsletter-form button {
		padding: 0.75rem 1.5rem;
		background-color: #2563eb;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.newsletter-form button:hover {
		background-color: #1d4ed8;
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.footer-bottom {
		max-width: 1200px;
		margin: 0 auto;
		margin-top: 3rem;
		padding-top: 2rem;
		border-top: 1px solid #e5e7eb;
		text-align: center;
		color: #6b7280;
	}

	@media (max-width: 768px) {
		.nav-links span {
			display: none;
		}

		.nav-link {
			padding: 0.5rem;
		}

		.newsletter-form {
			flex-direction: column;
		}

		.newsletter-form button {
			width: 100%;
		}
	}

	@media (max-width: 640px) {
		nav {
			padding: 1rem;
		}

		.logo {
			font-size: 1.25rem;
		}

		.nav-links {
			gap: 0.75rem;
		}
	}
</style>
