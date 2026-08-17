<svelte:head>
	<title>Lagerküchen-Planer</title>
	<meta
		name="description"
		content="Menüplan, Mengen und Einkaufsliste für Jugend-, Schul- und Sportlager – passend zum eCamp-Programm."
	/>
</svelte:head>

<main class="mx-auto max-w-3xl px-4 py-16">
	<h1 class="text-4xl font-bold tracking-tight text-gray-900">Lagerküchen-Planer</h1>
	<p class="mt-4 text-lg text-gray-600">
		Aus deinem eCamp-Programm wird ein passender Menüplan: Wandertag heisst Lunchpaket, Besuchstag
		heisst Kuchen für die dreifache Menge, Anreisetag heisst – die Küche steht noch nicht.
	</p>

	<div class="mt-8">
		<a
			href="/import"
			class="inline-flex items-center rounded-md bg-sky-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-sky-700"
		>
			Programm importieren →
		</a>
	</div>

	<section class="mt-12 grid gap-6 sm:grid-cols-3">
		<div>
			<h2 class="font-semibold text-gray-900">1. Importieren</h2>
			<p class="mt-1 text-sm text-gray-600">
				eCamp-PDF hochladen oder Tage manuell erfassen. Alles bleibt korrigierbar.
			</p>
		</div>
		<div>
			<h2 class="font-semibold text-gray-900">2. Planen</h2>
			<p class="mt-1 text-sm text-gray-600">
				Mengen, Regeln und Menüplan folgen in den nächsten Phasen.
			</p>
		</div>
		<div>
			<h2 class="font-semibold text-gray-900">3. Kochen</h2>
			<p class="mt-1 text-sm text-gray-600">
				Einkaufsliste und druckbares Küchendossier – offline im Lager nutzbar.
			</p>
		</div>
	</section>

	<p class="mt-12 text-xs text-gray-400">
		Aktueller Stand: Phase 1 – eCamp-Parser und Import-Assistent.
	</p>
</main>
