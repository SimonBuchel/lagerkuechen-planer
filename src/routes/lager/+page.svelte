<script lang="ts">
	import { session } from '$lib/stores/session.svelte';
	import { ALLERGENS } from '$lib/allergens/data';
	import { ROLE_LABELS } from '$lib/labels';
	import { totalHeadcount } from '$lib/quantities/scale';
	import {
		SEASON_LABELS,
		CAMP_TYPE_LABELS,
		type Season,
		type CampType
	} from '$lib/menu/diet';
	import type { AgeBand, Role } from '$lib/quantities/types';
	import type { Allergen, Severity } from '$lib/allergens/types';

	const ROLES: Role[] = ['teilnehmende', 'leitende', 'kuechenteam', 'besuch'];
	const AGE_BANDS: AgeBand[] = ['6-10', '11-14', '15-17', '18+'];
	const SEASONS: Season[] = ['fruehling', 'sommer', 'herbst', 'winter'];
	const CAMP_TYPES: CampType[] = ['zelt', 'haus'];
	const SEVERITIES: { key: Severity; label: string }[] = [
		{ key: 'unvertraeglichkeit', label: 'Unverträglichkeit' },
		{ key: 'allergie', label: 'Allergie' },
		{ key: 'anaphylaxie', label: 'Anaphylaxie' }
	];

	const ctx = session.context;
	const heads = $derived(totalHeadcount(ctx.groups));

	function addGroup() {
		ctx.groups.push({ role: 'teilnehmende', ageBand: '11-14', count: 0 });
	}
	function removeGroup(i: number) {
		ctx.groups.splice(i, 1);
	}

	let kesselText = $state(ctx.equipment.kesselLiter.join(', '));
	function applyKessel() {
		ctx.equipment.kesselLiter = kesselText
			.split(',')
			.map((s) => Number(s.trim()))
			.filter((n) => !Number.isNaN(n) && n > 0);
	}

	let newPseudonym = $state('');
	let newSeverity = $state<Severity>('allergie');
	let newAllergens = $state<Set<Allergen>>(new Set());
	function toggleAllergen(a: Allergen) {
		const next = new Set(newAllergens);
		next.has(a) ? next.delete(a) : next.add(a);
		newAllergens = next;
	}
	function addAllergy() {
		if (!newPseudonym.trim() || newAllergens.size === 0) return;
		ctx.allergies.push({
			pseudonym: newPseudonym.trim(),
			allergens: [...newAllergens],
			severity: newSeverity
		});
		newPseudonym = '';
		newAllergens = new Set();
		newSeverity = 'allergie';
	}
	function removeAllergy(i: number) {
		ctx.allergies.splice(i, 1);
	}
</script>

<svelte:head><title>Lager einrichten – Lagerküchen-Planer</title></svelte:head>

<div class="mx-auto max-w-4xl px-4 py-8">
	<h1 class="text-2xl font-bold text-gray-900">Lager einrichten</h1>
	<p class="mt-1 text-gray-600">
		Wer kommt, wie wird gegessen, was steht in der Küche? Diese Angaben steuern anschliessend den
		Menüplan, die Mengen und das Budget.
	</p>

	<!-- Live-Zusammenfassung -->
	<div class="mt-4 flex flex-wrap gap-4 rounded-xl bg-gray-900 p-4 text-white">
		<div>
			<div class="text-2xl font-bold">{heads}</div>
			<div class="text-xs text-gray-400 uppercase">Personen</div>
		</div>
		<div>
			<div class="text-2xl font-bold">{ctx.diet.vegetarisch}</div>
			<div class="text-xs text-gray-400 uppercase">Vegetarisch</div>
		</div>
		<div>
			<div class="text-2xl font-bold">{ctx.diet.vegan}</div>
			<div class="text-xs text-gray-400 uppercase">Vegan</div>
		</div>
		<div>
			<div class="text-2xl font-bold">{ctx.allergies.length}</div>
			<div class="text-xs text-gray-400 uppercase">Allergien</div>
		</div>
		<div>
			<div class="text-2xl font-bold">CHF {ctx.budgetPerPersonDay}</div>
			<div class="text-xs text-gray-400 uppercase">Budget/Person/Tag</div>
		</div>
	</div>

	<div class="mt-6 grid gap-5 lg:grid-cols-2">
		<!-- Rahmen -->
		<section class="rounded-xl border border-gray-200 bg-white p-5 lg:col-span-2">
			<h2 class="font-semibold text-gray-900">🗓️ Rahmen</h2>
			<p class="mt-0.5 text-xs text-gray-500">
				Saison und Lagerart bestimmen mit, welche Menüs optimal sind (warm/kalt, Ofen ja/nein).
			</p>
			<div class="mt-3 grid grid-cols-2 gap-3 sm:max-w-md">
				<label class="text-sm text-gray-600"
					>Jahreszeit
					<select class="mt-0.5 w-full rounded-lg border-gray-300 text-sm" bind:value={ctx.season}>
						{#each SEASONS as s (s)}<option value={s}>{SEASON_LABELS[s]}</option>{/each}
					</select>
				</label>
				<label class="text-sm text-gray-600"
					>Lagerart
					<select class="mt-0.5 w-full rounded-lg border-gray-300 text-sm" bind:value={ctx.campType}>
						{#each CAMP_TYPES as c (c)}<option value={c}>{CAMP_TYPE_LABELS[c]}</option>{/each}
					</select>
				</label>
			</div>
		</section>

		<!-- Personen -->
		<section class="rounded-xl border border-gray-200 bg-white p-5">
			<h2 class="font-semibold text-gray-900">👥 Personen</h2>
			<div class="mt-3 space-y-2">
				{#each ctx.groups as g, i (i)}
					<div class="flex flex-wrap items-center gap-2">
						<select class="flex-1 rounded-lg border-gray-300 text-sm" bind:value={g.role}>
							{#each ROLES as r (r)}<option value={r}>{ROLE_LABELS[r]}</option>{/each}
						</select>
						<select class="rounded-lg border-gray-300 text-sm" bind:value={g.ageBand}>
							{#each AGE_BANDS as a (a)}<option value={a}>{a} J.</option>{/each}
						</select>
						<input
							type="number"
							min="0"
							class="w-20 rounded-lg border-gray-300 text-sm"
							bind:value={g.count}
						/>
						<button
							class="text-gray-300 hover:text-red-600"
							onclick={() => removeGroup(i)}
							aria-label="entfernen">✕</button
						>
					</div>
				{/each}
			</div>
			<button
				class="mt-3 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium hover:bg-gray-200"
				onclick={addGroup}>+ Gruppe</button
			>
		</section>

		<!-- Ernährung -->
		<section class="rounded-xl border border-gray-200 bg-white p-5">
			<h2 class="font-semibold text-gray-900">🥗 Ernährungsformen</h2>
			<p class="mt-0.5 text-xs text-gray-500">
				Anzahl Personen je Form (steuert den Vegi-Anteil im Menü).
			</p>
			<div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
				{#each [['vegetarisch', 'Vegetarisch'], ['vegan', 'Vegan'], ['laktosefrei', 'Laktosefrei'], ['glutenfrei', 'Glutenfrei'], ['halal', 'Halal'], ['koscher', 'Koscher']] as [key, label] (key)}
					<label class="text-sm text-gray-600"
						>{label}
						<input
							type="number"
							min="0"
							class="mt-0.5 w-full rounded-lg border-gray-300 text-sm"
							bind:value={ctx.diet[key as keyof typeof ctx.diet]}
						/>
					</label>
				{/each}
			</div>
		</section>

		<!-- Küche -->
		<section class="rounded-xl border border-gray-200 bg-white p-5">
			<h2 class="font-semibold text-gray-900">🍳 Küchenausstattung</h2>
			<div class="mt-3 space-y-2 text-sm text-gray-600">
				<label class="flex items-center justify-between gap-2"
					>Gasbrenner / Kochstellen<input
						type="number"
						min="0"
						class="w-24 rounded-lg border-gray-300"
						bind:value={ctx.equipment.gasbrenner}
					/></label
				>
				<label class="flex items-center justify-between gap-2"
					>Kessel (Liter, mit Komma)<input
						type="text"
						class="w-40 rounded-lg border-gray-300"
						bind:value={kesselText}
						onchange={applyKessel}
					/></label
				>
				<label class="flex items-center justify-between gap-2"
					>Backofen vorhanden<input
						type="checkbox"
						class="rounded"
						bind:checked={ctx.equipment.backofen}
					/></label
				>
				<label class="flex items-center justify-between gap-2"
					>Kühlkapazität (Liter)<input
						type="number"
						min="0"
						class="w-24 rounded-lg border-gray-300"
						bind:value={ctx.equipment.kuehlkapazitaetLiter}
					/></label
				>
				<label class="flex items-center justify-between gap-2"
					>Budget CHF/Person/Tag<input
						type="number"
						min="0"
						step="0.5"
						class="w-24 rounded-lg border-gray-300"
						bind:value={ctx.budgetPerPersonDay}
					/></label
				>
			</div>
		</section>

		<!-- Allergien -->
		<section class="rounded-xl border border-gray-200 bg-white p-5">
			<h2 class="font-semibold text-gray-900">⚠️ Allergien</h2>
			<p class="mt-0.5 text-xs text-gray-500">Nur Pseudonyme (z. B. TN-07) – keine Klarnamen.</p>
			<ul class="mt-2 space-y-1 text-sm">
				{#each ctx.allergies as a, i (i)}
					<li class="flex items-center gap-2 rounded-lg bg-gray-50 px-2 py-1">
						<span class="font-mono font-medium">{a.pseudonym}</span>
						<span
							class="text-xs {a.severity === 'anaphylaxie'
								? 'font-semibold text-red-600'
								: 'text-gray-500'}">{a.severity}</span
						>
						<span class="truncate text-xs text-gray-400">{a.allergens.join(', ')}</span>
						<button
							class="ml-auto text-gray-300 hover:text-red-600"
							onclick={() => removeAllergy(i)}
							aria-label="entfernen">✕</button
						>
					</li>
				{/each}
			</ul>
			<div class="mt-3 space-y-2 rounded-lg border border-dashed border-gray-300 p-2">
				<div class="flex flex-wrap items-center gap-2">
					<input
						type="text"
						placeholder="Pseudonym (TN-07)"
						class="w-32 rounded-lg border-gray-300 text-sm"
						bind:value={newPseudonym}
					/>
					<select class="rounded-lg border-gray-300 text-sm" bind:value={newSeverity}>
						{#each SEVERITIES as s (s.key)}<option value={s.key}>{s.label}</option>{/each}
					</select>
					<button
						class="rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700"
						onclick={addAllergy}>hinzufügen</button
					>
				</div>
				<div class="flex flex-wrap gap-1">
					{#each ALLERGENS as al (al.key)}
						<button
							type="button"
							onclick={() => toggleAllergen(al.key)}
							class="rounded-full px-2 py-0.5 text-[11px] {newAllergens.has(al.key)
								? 'bg-amber-500 text-white'
								: 'bg-gray-100 text-gray-500 hover:bg-gray-200'}">{al.label}</button
						>
					{/each}
				</div>
			</div>
		</section>
	</div>

	<div class="mt-6 flex justify-end">
		<a
			href="/menu"
			class="inline-flex items-center rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
			>Weiter zum Menüplan →</a
		>
	</div>
</div>
