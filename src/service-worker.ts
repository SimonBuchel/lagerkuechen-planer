/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

/**
 * Minimal offline service worker (Kapitel 7: Dossier/Einkaufsliste offline im
 * Lager nutzbar). Precaches the built app shell and static files, then serves
 * navigations and assets from cache when the network is unavailable. The camp
 * data itself lives in-session / localStorage, so the app opens offline.
 */

import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `lagerkueche-${version}`;
const ASSETS = [...build, ...files];

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(ASSETS))
			.then(() => sw.skipWaiting())
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => sw.clients.claim())
	);
});

sw.addEventListener('fetch', (event) => {
	const request = event.request;
	if (request.method !== 'GET' || !request.url.startsWith('http')) return;

	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);
			const cached = await cache.match(request);
			try {
				const response = await fetch(request);
				if (response.ok && new URL(request.url).origin === location.origin) {
					cache.put(request, response.clone());
				}
				return response;
			} catch {
				if (cached) return cached;
				// Offline navigation fallback: serve the cached app shell.
				if (request.mode === 'navigate') {
					const shell = await cache.match('/');
					if (shell) return shell;
				}
				throw new Error('offline and not cached');
			}
		})()
	);
});
