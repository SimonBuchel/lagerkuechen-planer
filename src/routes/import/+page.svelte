<script lang="ts">
	import type { Category, ParsedBlock, ParsedDay, ParsedProgram } from '$lib/parser/types';
	import { CATEGORY_LABELS } from '$lib/parser/types';
	import { emptyProgram, manualDay, standardTemplate } from '$lib/templates';

	const CATEGORIES: Category[] = ['ES', 'LA', 'LP', 'LS'];
	const CATEGORY_STYLE: Record<Category, string> = {
		ES: 'bg-gray-200 text-gray-800',
		LA: 'bg-orange-200 text-orange-900',
		LP: 'bg-sky-200 text-sky-900',
		LS: 'bg-green-200 text-green-900'
	};

	let program = $state<ParsedProgram | null>(null);
	let fileName = $state<string | null>(null);
	let lastFile = $state<File | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);

	const specialCount = $derived(
		program
			? program.days.reduce(
					(sum, d) => sum + d.blocks.filter((b) => b.category && b.category !== 'ES').length,
					0
				)
			: 0
	);
	const mealCount = $derived(
		program
			? program.days.reduce((sum, d) => sum + d.blocks.filter((b) => b.category === 'ES').length, 0)
			: 0
	);

	async function parseFile(file: File, anchorHour?: number) {
		loading = true;
		error = null;
		try {
			const body = new FormData();
			body.set('file', file);
			if (anchorHour !== undefined) body.set('anchorHour', String(anchorHour));
			const res = await fetch('/api/parse', { method: 'POST', body });
			const data = await res.json();
			if (!res.ok) {
				error = data.error ?? 'Unbekannter Fehler beim Einlesen.';
				return;
			}
			program = data.program as ParsedProgram;
			lastFile = file;
			fileName = file.name;
		} catch {
			error = 'Netzwerkfehler – bitte erneut versuchen.';
		} finally {
			loading = false;
		}
	}

	function onFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) parseFile(file);
	}

	function recomputeAnchor(hour: number) {
		if (lastFile) parseFile(lastFile, hour);
	}

	function loadTemplate(days: number) {
		program = standardTemplate(days);
		fileName = null;
		lastFile = null;
		error = null;
	}

	function startManual() {
		program = emptyProgram();
		fileName = null;
		lastFile = null;
		error = null;
	}

	function addBlock(day: ParsedDay) {
		day.blocks.push({ category: 'ES', start: null, end: null, title: '', responsible: null });
	}
	function removeBlock(day: ParsedDay, index: number) {
		day.blocks.splice(index, 1);
	}
	function addDay() {
		program?.days.push(manualDay());
	}
	function removeDay(index: number) {
		program?.days.splice(index, 1);
	}

	function downloadJson() {
		if (!program) return;
		const blob = new Blob([JSON.stringify(program, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = (fileName?.replace(/\.pdf$/i, '') ?? 'lagerprogramm') + '.json';
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<svelte:head>
	<title>Programm importieren – Lagerküchen-Planer</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-8">
	<h1 class="text-2xl font-bold text-gray-900">Programm importieren</h1>
	<p class="mt-1 text-gray-600">
		Lade deinen eCamp-«Picasso»-Export als PDF hoch. Das Ergebnis kannst du unten Zeile für Zeile
		prüfen und korrigieren, bevor es weitergeht.
	</p>

	<!-- Upload + alternatives -->
	<div class="mt-6 grid gap-4 sm:grid-cols-2">
		<label
			class="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-6 text-center transition hover:border-sky-400 hover:bg-sky-50"
		>
			<span class="font-medium text-gray-800">eCamp-PDF hochladen</span>
			<span class="mt-1 text-sm text-gray-500">Picasso-Druck, beliebig viele Tage</span>
			<input type="file" accept="application/pdf" class="hidden" onchange={onFileChange} />
		</label>

		<div class="flex flex-col justify-center gap-2 rounded-lg border border-gray-200 bg-white p-6">
			<span class="text-sm font-medium text-gray-700">Kein eCamp? Ohne Import starten:</span>
			<div class="flex flex-wrap gap-2">
				<button
					class="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-200"
					onclick={() => loadTemplate(7)}>Vorlage 7 Tage</button
				>
				<button
					class="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-200"
					onclick={() => loadTemplate(14)}>Vorlage 14 Tage</button
				>
				<button
					class="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-200"
					onclick={startManual}>Leer starten</button
				>
			</div>
		</div>
	</div>

	{#if loading}
		<p class="mt-6 text-sky-700">PDF wird gelesen …</p>
	{/if}

	{#if error}
		<div class="mt-6 rounded-md border border-red-300 bg-red-50 p-4 text-red-800">
			{error}
		</div>
	{/if}

	{#if program}
		<!-- Summary -->
		<div class="mt-8 flex flex-wrap items-center gap-4 rounded-lg bg-gray-50 p-4">
			<div>
				<div class="text-2xl font-bold text-gray-900">{program.days.length}</div>
				<div class="text-xs text-gray-500 uppercase">Tage</div>
			</div>
			<div>
				<div class="text-2xl font-bold text-gray-900">{mealCount}</div>
				<div class="text-xs text-gray-500 uppercase">Mahlzeiten</div>
			</div>
			<div>
				<div class="text-2xl font-bold text-gray-900">{specialCount}</div>
				<div class="text-xs text-gray-500 uppercase">Sonderaktivitäten</div>
			</div>
			{#if program.camp}
				<div class="ml-auto text-right text-xs text-gray-400">
					<div>Camp: {program.camp}</div>
					{#if program.periods.length}<div>Periode: {program.periods.join(', ')}</div>{/if}
				</div>
			{/if}
		</div>

		<!-- Time anchor confirmation -->
		{#if lastFile}
			<div
				class="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm"
			>
				<span class="text-amber-900">
					Startzeit der Zeitachse:
					<strong>{String(program.timeAxis.anchorHour).padStart(2, '0')}:00</strong>
					({program.timeAxis.anchorSource === 'decoded'
						? 'automatisch erkannt'
						: 'Standard – bitte prüfen'})
				</span>
				<label class="flex items-center gap-1 text-amber-900">
					korrigieren:
					<select
						class="rounded border-amber-300 bg-white px-2 py-1"
						onchange={(e) => recomputeAnchor(Number((e.target as HTMLSelectElement).value))}
					>
						{#each Array.from({ length: 24 }, (_, h) => h) as h (h)}
							<option value={h} selected={h === program.timeAxis.anchorHour}>
								{String(h).padStart(2, '0')}:00
							</option>
						{/each}
					</select>
				</label>
			</div>
		{/if}

		<!-- Parser warnings -->
		{#if program.warnings.length}
			<ul
				class="mt-4 space-y-1 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
			>
				{#each program.warnings as w, i (i)}
					<li>⚠️ {w}</li>
				{/each}
			</ul>
		{/if}

		<!-- Editable days -->
		<div class="mt-6 space-y-6">
			{#each program.days as day, di (di)}
				<section class="rounded-lg border border-gray-200 bg-white">
					<header class="flex flex-wrap items-center gap-3 border-b border-gray-100 p-3">
						<input type="date" class="rounded border-gray-300 text-sm" bind:value={day.date} />
						<input
							type="text"
							class="min-w-40 flex-1 rounded border-gray-300 text-sm"
							placeholder="Kopfzeile (z. B. Mo 14.07.)"
							bind:value={day.header}
						/>
						<button class="text-sm text-red-600 hover:underline" onclick={() => removeDay(di)}
							>Tag löschen</button
						>
					</header>

					<div class="divide-y divide-gray-50">
						{#each day.blocks as block, bi (bi)}
							<div class="flex flex-wrap items-center gap-2 p-3">
								<select
									class="rounded border-gray-300 text-sm {block.category
										? CATEGORY_STYLE[block.category]
										: ''}"
									bind:value={block.category}
								>
									{#each CATEGORIES as c (c)}
										<option value={c}>{c} – {CATEGORY_LABELS[c]}</option>
									{/each}
								</select>
								<input
									type="time"
									class="w-24 rounded border-gray-300 text-sm"
									value={block.start ?? ''}
									onchange={(e) => (block.start = (e.target as HTMLInputElement).value || null)}
								/>
								<span class="text-gray-400">–</span>
								<input
									type="time"
									class="w-24 rounded border-gray-300 text-sm"
									value={block.end ?? ''}
									onchange={(e) => (block.end = (e.target as HTMLInputElement).value || null)}
								/>
								<input
									type="text"
									class="min-w-40 flex-1 rounded border-gray-300 text-sm"
									placeholder="Titel"
									bind:value={block.title}
								/>
								<input
									type="text"
									class="w-40 rounded border-gray-300 text-sm"
									placeholder="verantwortlich"
									value={block.responsible ?? ''}
									onchange={(e) =>
										(block.responsible = (e.target as HTMLInputElement).value || null)}
								/>
								<button
									class="text-gray-400 hover:text-red-600"
									title="Zeile löschen"
									onclick={() => removeBlock(day, bi)}>✕</button
								>
							</div>
						{/each}
					</div>

					<footer class="p-3">
						<button
							class="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
							onclick={() => addBlock(day)}>+ Zeile</button
						>
					</footer>
				</section>
			{/each}
		</div>

		<div class="mt-6 flex flex-wrap gap-3">
			<button
				class="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
				onclick={addDay}>+ Tag hinzufügen</button
			>
			<button
				class="ml-auto rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
				onclick={downloadJson}>Als JSON exportieren</button
			>
		</div>

		<p class="mt-3 text-xs text-gray-400">
			Hinweis: In dieser Phase wird nichts gespeichert. E-Mail-Adressen aus dem eCamp-Titel werden
			beim Import entfernt und nicht übernommen.
		</p>
	{/if}
</div>
