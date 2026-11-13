<script lang="ts">
	import type { Category, ParsedBlock, ParsedDay, ParsedProgram } from '$lib/parser/types';
	import { CATEGORY_LABELS } from '$lib/parser/types';
	import { emptyProgram, manualDay, standardTemplate } from '$lib/templates';
	import { setProgram } from '$lib/stores/session.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	// --- Direct import from eCamp (exact times, no PDF) ---
	// Off by default: app.ecamp3.ch's bot protection blocks server-side clients
	// until eCamp clears access (ECAMP_DIRECT_IMPORT=1).
	const ecampEnabled = $derived(page.data.ecampImport === true);
	interface EcampPeriod {
		id: string;
		iri: string;
		description: string;
		start: string;
		end: string;
	}
	interface EcampCamp {
		id: string;
		iri: string;
		name: string;
		title: string;
		periods: EcampPeriod[];
	}
	let ecampId = $state('');
	let ecampPw = $state('');
	let ecampCamps = $state<EcampCamp[] | null>(null);
	let ecampPeriod = $state('');
	let ecampBusy = $state(false);
	let ecampError = $state<string | null>(null);

	// Restore an existing eCamp session (httpOnly cookie) so the user needn't
	// log in again while it is valid.
	onMount(async () => {
		if (!ecampEnabled) return;
		try {
			const res = await fetch('/api/ecamp/camps');
			if (res.ok) {
				ecampCamps = (await res.json()).camps;
				pickDefaultPeriod();
			}
		} catch {
			/* offline – the PDF path still works */
		}
	});

	function pickDefaultPeriod() {
		if (!ecampPeriod) ecampPeriod = ecampCamps?.[0]?.periods[0]?.iri ?? '';
	}

	async function ecampLogin() {
		ecampBusy = true;
		ecampError = null;
		try {
			const res = await fetch('/api/ecamp/login', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ identifier: ecampId, password: ecampPw })
			});
			const data = await res.json();
			if (!res.ok) {
				ecampError = data.error ?? 'Anmeldung fehlgeschlagen.';
				return;
			}
			ecampPw = ''; // never keep the password around
			ecampCamps = data.camps;
			pickDefaultPeriod();
			if (!ecampCamps?.length) ecampError = 'Keine Lager in diesem eCamp-Konto gefunden.';
		} catch {
			ecampError = 'Netzwerkfehler – bitte erneut versuchen.';
		} finally {
			ecampBusy = false;
		}
	}

	async function ecampImport() {
		if (!ecampPeriod) return;
		ecampBusy = true;
		ecampError = null;
		error = null;
		try {
			const res = await fetch('/api/ecamp/import', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ periodIri: ecampPeriod })
			});
			const data = await res.json();
			if (!res.ok) {
				ecampError = data.error ?? 'Import fehlgeschlagen.';
				if (res.status === 401) ecampCamps = null;
				return;
			}
			program = data.program as ParsedProgram;
			lastFile = null;
			const camp = ecampCamps?.find((c) => c.periods.some((p) => p.iri === ecampPeriod));
			fileName = camp ? camp.title : 'ecamp';
		} catch {
			ecampError = 'Netzwerkfehler – bitte erneut versuchen.';
		} finally {
			ecampBusy = false;
		}
	}

	async function ecampLogout() {
		try {
			await fetch('/api/ecamp/logout', { method: 'POST' });
		} catch {
			/* ignore */
		}
		ecampCamps = null;
		ecampPeriod = '';
		ecampError = null;
	}

	function periodLabel(p: EcampPeriod): string {
		const fmt = (iso: string) => iso.slice(0, 10).split('-').reverse().join('.');
		return `${p.description ? p.description + ' · ' : ''}${fmt(p.start)} – ${fmt(p.end)}`;
	}

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

	// Share the current programme with the menu planner (in-session, no storage).
	$effect(() => {
		if (program) setProgram(program);
	});

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
		{#if ecampEnabled}Lade das Programm direkt aus eCamp (minutengenau) oder lade einen
			eCamp-PDF-Export hoch.{:else}Lade deinen eCamp-Export (PDF) hoch – beide Layouts werden
			automatisch erkannt.{/if} Das Ergebnis kannst du unten Zeile für Zeile prüfen und
		korrigieren, bevor es weitergeht.
	</p>

	<!-- Direct eCamp import + upload + alternatives -->
	<div class="mt-6 grid gap-4 sm:grid-cols-2 {ecampEnabled ? 'lg:grid-cols-3' : ''}">
		{#if ecampEnabled}
		<div class="rounded-lg border-2 border-emerald-200 bg-white p-5">
			<div class="flex items-center justify-between">
				<span class="font-medium text-gray-800">Direkt aus eCamp laden</span>
				<span class="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800"
					>EXAKT</span
				>
			</div>
			<p class="mt-0.5 text-xs text-gray-500">Zeiten minutengenau aus deinem eCamp-Konto.</p>

			{#if ecampCamps === null}
				<form class="mt-3 space-y-2" onsubmit={(e) => { e.preventDefault(); ecampLogin(); }}>
					<input
						type="email"
						autocomplete="username"
						placeholder="eCamp-E-Mail"
						class="w-full rounded-lg border-gray-300 text-sm"
						bind:value={ecampId}
						required
					/>
					<input
						type="password"
						autocomplete="current-password"
						placeholder="eCamp-Passwort"
						class="w-full rounded-lg border-gray-300 text-sm"
						bind:value={ecampPw}
						required
					/>
					<button
						type="submit"
						disabled={ecampBusy}
						class="w-full rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
						>{ecampBusy ? 'Anmelden …' : 'Bei eCamp anmelden'}</button
					>
				</form>
				<p class="mt-2 text-[11px] text-gray-400">
					Das Passwort wird nur an eCamp weitergereicht und nicht gespeichert. Namen von
					Verantwortlichen werden nicht übernommen.
				</p>
			{:else}
				<div class="mt-3 space-y-2">
					<select class="w-full rounded-lg border-gray-300 text-sm" bind:value={ecampPeriod}>
						{#each ecampCamps as camp (camp.iri)}
							<optgroup label={camp.title}>
								{#each camp.periods as p (p.iri)}
									<option value={p.iri}>{periodLabel(p)}</option>
								{/each}
							</optgroup>
						{/each}
					</select>
					<button
						onclick={ecampImport}
						disabled={ecampBusy || !ecampPeriod}
						class="w-full rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
						>{ecampBusy ? 'Lade …' : 'Programm importieren'}</button
					>
					<button class="text-[11px] text-gray-400 hover:text-gray-600" onclick={ecampLogout}
						>von eCamp abmelden</button
					>
				</div>
			{/if}
			{#if ecampError}
				<p class="mt-2 text-xs text-red-700">{ecampError}</p>
			{/if}
		</div>
		{/if}

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
			<div class="ml-auto flex items-center gap-3">
				{#if program.layout}
					<span
						class="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-800"
						title="Das Layout wurde automatisch erkannt – du musst nichts auswählen."
					>
						{program.layout === 'ecamp-api'
							? '✓ Direkt aus eCamp (exakte Zeiten)'
							: program.layout === 'grobprogramm'
								? '✓ Grobprogramm erkannt'
								: '✓ Picasso-Druck erkannt'}
					</span>
				{/if}
				{#if program.camp}
					<div class="text-right text-xs text-gray-400">
						<div>Camp: {program.camp}</div>
						{#if program.periods.length}<div>Periode: {program.periods.join(', ')}</div>{/if}
					</div>
				{/if}
				<a
					href="/lager"
					class="inline-flex items-center rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
					>Weiter: Lager einrichten →</a
				>
			</div>
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
				class="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
				onclick={downloadJson}>Als JSON exportieren</button
			>
			<a
				href="/lager"
				class="ml-auto inline-flex items-center rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
				>Weiter: Lager einrichten →</a
			>
		</div>

		<p class="mt-3 text-xs text-gray-400">
			Hinweis: In dieser Phase wird nichts gespeichert. E-Mail-Adressen aus dem eCamp-Titel werden
			beim Import entfernt und nicht übernommen.
		</p>
	{/if}
</div>
