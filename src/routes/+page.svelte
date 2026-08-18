<script lang="ts">
	import { tr } from '$lib/i18n/locale.svelte';

	const steps = [
		{ n: '1', icon: '📄', key: 'step1' },
		{ n: '2', icon: '🍽️', key: 'step2' },
		{ n: '3', icon: '🛒', key: 'step3' }
	] as const;

	const features = [
		{ icon: '🧠', title: 'Programm-schlau', text: 'Wander-, Bau- und Besuchstage steuern die Menüwahl automatisch.' },
		{ icon: '🥗', title: 'Vegi immer dabei', text: 'Für jede:n Vegetarier:in und Veganer:in wird die Portion mitgerechnet.' },
		{ icon: '⚠️', title: 'Allergien sicher', text: 'Nur Pseudonyme, kontrollierte Allergenliste, Anaphylaxie-Warnung.' },
		{ icon: '📊', title: 'Budget im Blick', text: 'Kosten pro Person und Tag – live gegen dein Ziel gerechnet.' }
	] as const;
</script>

<svelte:head>
	<title>Lagerküchen-Planer</title>
	<meta
		name="description"
		content="Menüplan, Mengen und Einkaufsliste für Jugend-, Schul- und Sportlager – passend zum eCamp-Programm."
	/>
</svelte:head>

<!-- Hero -->
<section class="relative overflow-hidden bg-gradient-to-b from-sky-50 to-white">
	<div class="mx-auto max-w-4xl px-4 py-20 text-center">
		<span
			class="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-sky-700 shadow-sm ring-1 ring-sky-100"
		>
			🍲 Vom eCamp-Programm zur fertigen Einkaufsliste
		</span>
		<h1 class="mt-5 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
			Lagerküchen-Planer
		</h1>
		<p class="mx-auto mt-4 max-w-2xl text-lg text-gray-600">{tr('landing.subtitle')}</p>
		<div class="mt-8 flex flex-wrap justify-center gap-3">
			<a
				href="/import"
				class="inline-flex items-center rounded-lg bg-sky-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-sky-700"
			>
				{tr('landing.cta')}
			</a>
			<a
				href="/lager"
				class="inline-flex items-center rounded-lg bg-white px-6 py-3 text-base font-semibold text-gray-700 ring-1 ring-gray-200 transition hover:bg-gray-50"
			>
				Ohne Import starten
			</a>
		</div>
	</div>
</section>

<main class="mx-auto max-w-5xl px-4 py-14">
	<!-- Steps -->
	<div class="grid gap-6 sm:grid-cols-3">
		{#each steps as s (s.n)}
			<div class="rounded-xl border border-gray-200 bg-white p-6">
				<div class="flex items-center gap-3">
					<span
						class="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-lg">{s.icon}</span
					>
					<span class="text-xs font-bold text-sky-600">Schritt {s.n}</span>
				</div>
				<h2 class="mt-3 font-semibold text-gray-900">{tr(`landing.${s.key}.title`)}</h2>
				<p class="mt-1 text-sm text-gray-600">{tr(`landing.${s.key}.text`)}</p>
			</div>
		{/each}
	</div>

	<!-- Why -->
	<h2 class="mt-16 text-center text-xl font-bold text-gray-900">Nicht einfach ein Menüplan</h2>
	<p class="mx-auto mt-2 max-w-2xl text-center text-sm text-gray-600">
		Der Planer denkt mit – Saison, Lagerart, Ernährung, Allergien und Programm fliessen automatisch
		ein.
	</p>
	<div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		{#each features as f (f.title)}
			<div class="rounded-xl border border-gray-200 bg-white p-5">
				<div class="text-2xl">{f.icon}</div>
				<h3 class="mt-2 font-semibold text-gray-900">{f.title}</h3>
				<p class="mt-1 text-sm text-gray-600">{f.text}</p>
			</div>
		{/each}
	</div>

	<div class="mt-14 flex justify-center">
		<a
			href="/import"
			class="inline-flex items-center rounded-lg bg-gray-900 px-6 py-3 text-base font-semibold text-white transition hover:bg-gray-800"
		>
			Jetzt Lager planen →
		</a>
	</div>
</main>
