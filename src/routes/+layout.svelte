<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { dev } from '$app/environment';
	import { page } from '$app/state';
	import { session } from '$lib/stores/session.svelte';

	let { children } = $props();

	// Register the offline service worker in production only (Kapitel 7: PWA).
	$effect(() => {
		if (!dev && 'serviceWorker' in navigator) {
			navigator.serviceWorker.register('/service-worker.js').catch(() => {});
		}
	});

	const links = [
		{ href: '/import', label: 'Import' },
		{ href: '/menu', label: 'Menüplan' },
		{ href: '/mengen', label: 'Mengen' },
		{ href: '/einkauf', label: 'Einkauf' },
		{ href: '/dossier', label: 'Dossier' }
	];
	const hasProgram = $derived(session.program !== null);
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<header class="border-b border-gray-200 bg-white">
	<nav class="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-2">
		<a href="/" class="mr-3 font-bold text-gray-900">🍲 Lagerküche</a>
		{#each links as l (l.href)}
			<a
				href={l.href}
				aria-disabled={!hasProgram && l.href !== '/import'}
				class="rounded px-3 py-1.5 text-sm font-medium {page.url.pathname === l.href
					? 'bg-sky-100 text-sky-800'
					: 'text-gray-600 hover:bg-gray-100'} {!hasProgram && l.href !== '/import'
					? 'pointer-events-none opacity-40'
					: ''}"
			>
				{l.label}
			</a>
		{/each}
	</nav>
</header>

{@render children()}
