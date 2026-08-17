<script lang="ts">
	import { session } from '$lib/stores/session.svelte';
	import { MENU_SLOTS, recipeById, SLOT_LABELS } from '$lib/menu/plan';
	import { scaleRecipe } from '$lib/recipes/scale';
	import { checkEquipment } from '$lib/quantities/kessel';
	import { evaluateMeal } from '$lib/allergens/evaluate';
	import { ALLERGENS } from '$lib/allergens/data';
	import { evaluateProgram, toProgramDays } from '$lib/rules/engine';
	import type { ActivityLevel, AgeBand, Role } from '$lib/quantities/types';
	import type { RuleHit } from '$lib/rules/types';
	import type { Allergen, Severity } from '$lib/allergens/types';

	const ROLES: Role[] = ['teilnehmende', 'leitende', 'kuechenteam', 'besuch'];
	const AGE_BANDS: AgeBand[] = ['6-10', '11-14', '15-17', '18+'];
	const SEVERITIES: Severity[] = ['unvertraeglichkeit', 'allergie', 'anaphylaxie'];

	const program = $derived(session.program);
	const plan = $derived(session.plan);
	const ctx = session.context;

	function activityForDay(hits: RuleHit[]): ActivityLevel {
		if (hits.some((h) => h.ruleId === 'wanderung')) return 'sport';
		if (hits.some((h) => h.ruleId === 'lagerbau')) return 'bau';
		return ctx.activity;
	}

	const days = $derived.by(() => {
		if (!program || !plan) return [];
		const hitsPerDay = evaluateProgram(toProgramDays(program.days));
		return plan.days.map((d, i) => {
			const activity = activityForDay(hitsPerDay[i] ?? []);
			const scaleCtx = { groups: ctx.groups, activity, diet: ctx.diet, isFirstDay: i === 0 };
			const meals = MENU_SLOTS.map((slot) => {
				const recipe = recipeById(d.slots[slot]);
				if (!recipe) return null;
				const scaled = scaleRecipe(recipe, scaleCtx);
				const equip = checkEquipment(scaled.cooking, ctx.equipment);
				const allergens = evaluateMeal(
					scaled.ingredients.map((x) => ({ name: x.name, allergens: x.allergens })),
					ctx.allergies
				);
				return { slot, recipe, scaled, equip, allergens };
			}).filter((m) => m !== null);
			return { date: d.date, index: i, activity, meals };
		});
	});

	function fmt(amount: number, unit: 'g' | 'ml' | 'stk'): string {
		if (unit === 'stk') return `${amount} Stk`;
		if (unit === 'g') return amount >= 1000 ? `${(amount / 1000).toFixed(2)} kg` : `${amount} g`;
		return amount >= 1000 ? `${(amount / 1000).toFixed(2)} l` : `${amount} ml`;
	}

	// --- context editing ---
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
		if (next.has(a)) next.delete(a);
		else next.add(a);
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

<svelte:head>
	<title>Mengen – Lagerküchen-Planer</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-8">
	<h1 class="text-2xl font-bold text-gray-900">Mengen & Allergene</h1>
	<p class="mt-1 text-gray-600">
		Skalierte Rezeptmengen zum Menüplan, mit Kesselbedarf und Allergen-Auswertung. Zahlen
		aktualisieren sich sofort, wenn du unten den Lager-Kontext änderst.
	</p>

	<!-- Context editor -->
	<details class="mt-6 rounded-lg border border-gray-200 bg-white p-4" open>
		<summary class="cursor-pointer font-semibold text-gray-800">Lager-Kontext</summary>

		<div class="mt-4 grid gap-6 lg:grid-cols-2">
			<div>
				<h3 class="text-sm font-semibold text-gray-700">Personen</h3>
				{#each ctx.groups as g, i (i)}
					<div class="mt-2 flex flex-wrap items-center gap-2">
						<select class="rounded border-gray-300 text-sm" bind:value={g.role}>
							{#each ROLES as r (r)}<option value={r}>{r}</option>{/each}
						</select>
						<select class="rounded border-gray-300 text-sm" bind:value={g.ageBand}>
							{#each AGE_BANDS as a (a)}<option value={a}>{a}</option>{/each}
						</select>
						<input
							type="number"
							min="0"
							class="w-20 rounded border-gray-300 text-sm"
							bind:value={g.count}
						/>
						<button class="text-gray-400 hover:text-red-600" onclick={() => removeGroup(i)}
							>✕</button
						>
					</div>
				{/each}
				<button
					class="mt-2 rounded bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200"
					onclick={addGroup}>+ Gruppe</button
				>

				<h3 class="mt-4 text-sm font-semibold text-gray-700">Ernährungsformen (Anzahl)</h3>
				<div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
					<label class="text-sm"
						>Vegetarisch<input
							type="number"
							min="0"
							class="mt-0.5 w-full rounded border-gray-300 text-sm"
							bind:value={ctx.diet.vegetarisch}
						/></label
					>
					<label class="text-sm"
						>Vegan<input
							type="number"
							min="0"
							class="mt-0.5 w-full rounded border-gray-300 text-sm"
							bind:value={ctx.diet.vegan}
						/></label
					>
					<label class="text-sm"
						>Laktosefrei<input
							type="number"
							min="0"
							class="mt-0.5 w-full rounded border-gray-300 text-sm"
							bind:value={ctx.diet.laktosefrei}
						/></label
					>
					<label class="text-sm"
						>Glutenfrei<input
							type="number"
							min="0"
							class="mt-0.5 w-full rounded border-gray-300 text-sm"
							bind:value={ctx.diet.glutenfrei}
						/></label
					>
					<label class="text-sm"
						>Halal<input
							type="number"
							min="0"
							class="mt-0.5 w-full rounded border-gray-300 text-sm"
							bind:value={ctx.diet.halal}
						/></label
					>
					<label class="text-sm"
						>Koscher<input
							type="number"
							min="0"
							class="mt-0.5 w-full rounded border-gray-300 text-sm"
							bind:value={ctx.diet.koscher}
						/></label
					>
				</div>
			</div>

			<div>
				<h3 class="text-sm font-semibold text-gray-700">Küchenausstattung</h3>
				<div class="mt-2 space-y-2 text-sm">
					<label class="flex items-center justify-between gap-2"
						>Gasbrenner<input
							type="number"
							min="0"
							class="w-24 rounded border-gray-300"
							bind:value={ctx.equipment.gasbrenner}
						/></label
					>
					<label class="flex items-center justify-between gap-2"
						>Kessel (Liter, mit Komma)<input
							type="text"
							class="w-40 rounded border-gray-300"
							bind:value={kesselText}
							onchange={applyKessel}
						/></label
					>
					<label class="flex items-center justify-between gap-2"
						>Backofen<input type="checkbox" bind:checked={ctx.equipment.backofen} /></label
					>
					<label class="flex items-center justify-between gap-2"
						>Kühlkapazität (l)<input
							type="number"
							min="0"
							class="w-24 rounded border-gray-300"
							bind:value={ctx.equipment.kuehlkapazitaetLiter}
						/></label
					>
				</div>

				<h3 class="mt-4 text-sm font-semibold text-gray-700">Allergien (nur Pseudonyme)</h3>
				<ul class="mt-2 space-y-1 text-sm">
					{#each ctx.allergies as a, i (i)}
						<li class="flex items-center gap-2">
							<span class="font-mono">{a.pseudonym}</span>
							<span class="text-gray-500">{a.severity}</span>
							<span class="text-gray-400">{a.allergens.join(', ')}</span>
							<button
								class="ml-auto text-gray-400 hover:text-red-600"
								onclick={() => removeAllergy(i)}>✕</button
							>
						</li>
					{/each}
				</ul>
				<div class="mt-2 rounded border border-gray-200 p-2">
					<div class="flex flex-wrap items-center gap-2">
						<input
							type="text"
							placeholder="Pseudonym (TN-07)"
							class="w-32 rounded border-gray-300 text-sm"
							bind:value={newPseudonym}
						/>
						<select class="rounded border-gray-300 text-sm" bind:value={newSeverity}>
							{#each SEVERITIES as s (s)}<option value={s}>{s}</option>{/each}
						</select>
						<button
							class="rounded bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200"
							onclick={addAllergy}>hinzufügen</button
						>
					</div>
					<div class="mt-2 flex flex-wrap gap-1">
						{#each ALLERGENS as al (al.key)}
							<button
								class="rounded-full px-2 py-0.5 text-xs {newAllergens.has(al.key)
									? 'bg-sky-600 text-white'
									: 'bg-gray-100 text-gray-600'}"
								onclick={() => toggleAllergen(al.key)}>{al.label}</button
							>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</details>

	{#if !program || !plan}
		<div class="mt-6 rounded-lg border border-gray-200 bg-white p-6 text-gray-700">
			Kein Menüplan vorhanden. <a class="text-sky-700 underline" href="/menu">Zum Menüplan</a> oder
			zuerst
			<a class="text-sky-700 underline" href="/import">importieren</a>.
		</div>
	{:else}
		<div class="mt-6 space-y-6">
			{#each days as day (day.index)}
				<section class="rounded-lg border border-gray-200 bg-white">
					<header class="flex items-center justify-between border-b border-gray-100 p-3">
						<h2 class="font-semibold text-gray-900">
							Tag {day.index + 1}{day.date ? ` · ${day.date}` : ''}
						</h2>
						<span class="text-xs text-gray-400">Aktivität: {day.activity}</span>
					</header>

					{#if day.meals.length === 0}
						<p class="p-3 text-sm text-gray-400">Noch keine Gerichte zugeteilt.</p>
					{:else}
						<div class="divide-y divide-gray-50">
							{#each day.meals as m (m.slot)}
								<div class="p-3">
									<div class="flex items-baseline justify-between">
										<h3 class="font-medium text-gray-800">
											<span class="text-xs text-gray-400 uppercase">{SLOT_LABELS[m.slot]}</span>
											· {m.recipe.name}
										</h3>
										<span class="text-xs text-gray-400"
											>{m.scaled.effectivePersons} Portionen · Kessel {m.scaled.cooking.kesselLiter} l
											· Rüsten {m.scaled.cooking.ruestPersonenminuten} Pers.-Min.</span
										>
									</div>

									<ul
										class="mt-2 grid gap-x-6 gap-y-0.5 text-sm text-gray-700 sm:grid-cols-2 lg:grid-cols-3"
									>
										{#each m.scaled.ingredients as ing (ing.name)}
											<li class="flex justify-between gap-2">
												<span>{ing.name}</span>
												<span class="font-medium">{fmt(ing.amount, ing.unit)}</span>
											</li>
										{/each}
									</ul>

									{#each m.equip as w (w.kind)}
										<div class="mt-1 text-xs text-red-700">⚠️ {w.message}</div>
									{/each}

									{#if m.allergens.affected.length}
										<div class="mt-2 text-xs text-amber-800">
											Nicht essbar für: {m.allergens.affected.join(', ')}
										</div>
									{/if}
									{#each m.allergens.anaphylaxisWarnings as w, i (i)}
										<div
											class="mt-1 rounded border border-red-300 bg-red-50 p-2 text-xs text-red-800"
										>
											🚑 {w}
										</div>
									{/each}
								</div>
							{/each}
						</div>
					{/if}
				</section>
			{/each}
		</div>
	{/if}
</div>
