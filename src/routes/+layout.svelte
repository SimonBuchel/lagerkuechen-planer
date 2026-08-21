<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { dev } from '$app/environment';
	import { page } from '$app/state';
	import { session } from '$lib/stores/session.svelte';
	import { loadCustomRecipes } from '$lib/recipes/storage';
	import { LOCALES } from '$lib/i18n';
	import { locale, setLocale, tr } from '$lib/i18n/locale.svelte';

	let { children, data } = $props();

	// Persist the camp setup across reloads (customer-ready: settings should stick).
	const CONTEXT_KEY = 'camp-context';
	let contextHydrated = $state(false);
	onMount(() => {
		try {
			const raw = localStorage.getItem(CONTEXT_KEY);
			if (raw) Object.assign(session.context, JSON.parse(raw));
		} catch {
			/* ignore corrupt storage */
		}
		contextHydrated = true;
	});
	$effect(() => {
		if (!contextHydrated) return;
		try {
			localStorage.setItem(CONTEXT_KEY, JSON.stringify(session.context));
		} catch {
			/* ignore quota / private mode */
		}
	});

	// Register the offline service worker in production only (Kapitel 7: PWA).
	$effect(() => {
		if (!dev && 'serviceWorker' in navigator) {
			navigator.serviceWorker.register('/service-worker.js').catch(() => {});
		}
	});

	// Hydrate the user's recipe library into the registry (Phase 6).
	$effect(() => {
		loadCustomRecipes();
	});

	const links = [
		{ href: '/import', key: 'nav.import' },
		{ href: '/lager', key: 'nav.lager' },
		{ href: '/menu', key: 'nav.menu' },
		{ href: '/einkauf', key: 'nav.einkauf' },
		{ href: '/dossier', key: 'nav.dossier' }
	];
	const hasProgram = $derived(session.program !== null);
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="flex min-h-screen flex-col">
	<header class="border-b border-gray-200 bg-white">
		<nav class="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-2">
			<a href="/" class="mr-3 font-bold text-gray-900">🍲 Lagerküche</a>
			{#each links as l (l.href)}
				<a
					href={l.href}
					aria-disabled={!hasProgram && l.href !== '/import'}
					title={!hasProgram && l.href !== '/import'
						? 'Zuerst ein Programm importieren'
						: undefined}
					class="rounded px-3 py-1.5 text-sm font-medium {page.url.pathname === l.href
						? 'bg-sky-100 text-sky-800'
						: 'text-gray-600 hover:bg-gray-100'} {!hasProgram && l.href !== '/import'
						? 'pointer-events-none opacity-40'
						: ''}"
				>
					{tr(l.key)}
				</a>
			{/each}
			<a
				href="/rezepte"
				class="ml-auto rounded px-3 py-1.5 text-sm font-medium {page.url.pathname === '/rezepte'
					? 'bg-sky-100 text-sky-800'
					: 'text-gray-600 hover:bg-gray-100'}">{tr('nav.rezepte')}</a
			>
			{#if data.authConfigured}
				<a
					href="/konto"
					class="rounded px-3 py-1.5 text-sm font-medium {page.url.pathname === '/konto'
						? 'bg-sky-100 text-sky-800'
						: 'text-gray-600 hover:bg-gray-100'}">{tr('nav.konto')}</a
				>
			{/if}
			<span class="ml-2 flex items-center gap-0.5">
				{#each LOCALES as l (l.code)}
					<button
						onclick={() => setLocale(l.code)}
						class="rounded px-1.5 py-0.5 text-xs font-semibold {locale.current === l.code
							? 'bg-gray-800 text-white'
							: 'text-gray-400 hover:bg-gray-100'}">{l.label}</button
					>
				{/each}
			</span>
		</nav>
	</header>

	<main class="flex-1">{@render children()}</main>

	<footer class="border-t border-gray-200 bg-white">
		<div
			class="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3 text-xs text-gray-500"
		>
			<span>© Lagerküchen-Planer</span>
			<a href="/datenschutz" class="hover:underline">{tr('footer.privacy')}</a>
			<a href="/impressum" class="hover:underline">{tr('footer.imprint')}</a>
			<a href="/agb" class="hover:underline">{tr('footer.terms')}</a>
		</div>
	</footer>
</div>
