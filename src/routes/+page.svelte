<script lang="ts">
	import { tr } from '$lib/i18n/locale.svelte';
</script>

<svelte:head>
	<title>Lagerküchen-Planer</title>
	<meta
		name="description"
		content="Menüplan, Mengen und Einkaufsliste für Jugend-, Schul- und Sportlager – passend zum eCamp-Programm."
	/>
</svelte:head>

<main class="mx-auto max-w-3xl px-4 py-16">
	<h1 class="text-4xl font-bold tracking-tight text-gray-900">Lagerküchen-Planer</h1>
	<p class="mt-4 text-lg text-gray-600">{tr('landing.subtitle')}</p>

	<div class="mt-8">
		<a
			href="/import"
			class="inline-flex items-center rounded-md bg-sky-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-sky-700"
		>
			{tr('landing.cta')}
		</a>
	</div>

	<section class="mt-12 grid gap-6 sm:grid-cols-3">
		<div>
			<h2 class="font-semibold text-gray-900">{tr('landing.step1.title')}</h2>
			<p class="mt-1 text-sm text-gray-600">{tr('landing.step1.text')}</p>
		</div>
		<div>
			<h2 class="font-semibold text-gray-900">{tr('landing.step2.title')}</h2>
			<p class="mt-1 text-sm text-gray-600">{tr('landing.step2.text')}</p>
		</div>
		<div>
			<h2 class="font-semibold text-gray-900">{tr('landing.step3.title')}</h2>
			<p class="mt-1 text-sm text-gray-600">{tr('landing.step3.text')}</p>
		</div>
	</section>
</main>
