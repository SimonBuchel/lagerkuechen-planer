<script lang="ts">
	import { session } from '$lib/stores/session.svelte';
	import {
		autoAssign,
		buildPlan,
		MENU_SLOTS,
		recipeById,
		recipesForSlot,
		SLOT_LABELS
	} from '$lib/menu/plan';
	import { scaleRecipe } from '$lib/recipes/scale';
	import { checkEquipment } from '$lib/quantities/kessel';
	import { evaluateMeal } from '$lib/allergens/evaluate';
	import { allergenLabel } from '$lib/allergens/data';
	import { totalHeadcount } from '$lib/quantities/scale';
	import { evaluateProgram, toProgramDays } from '$lib/rules/engine';
	import { mealGapWarnings, varietyWarnings } from '$lib/rules/checks';
	import { computeBudget } from '$lib/budget/budget';
	import { mealDietStatus, vegiShare } from '$lib/menu/diet';
	import type { ActivityLevel } from '$lib/quantities/types';
	import type { MealSlot, RuleHit } from '$lib/rules/types';

	const program = $derived(session.program);
	const plan = $derived(session.plan);
	const ctx = session.context;

	const heads = $derived(totalHeadcount(ctx.groups));
	const vegi = $derived(vegiShare(ctx.diet.vegetarisch, ctx.diet.vegan, heads));

	// Build a diet-aware suggested plan automatically the first time (user feedback:
	// the plan should already adapt to the group, not start empty).
	$effect(() => {
		if (program && (!session.plan || session.plan.days.length !== program.days.length)) {
			session.plan = autoAssign(buildPlan(program), { vegiShare: vegi });
		}
	});

	const ruleHits = $derived(program ? evaluateProgram(toProgramDays(program.days)) : []);

	function activityForDay(hits: RuleHit[]): ActivityLevel {
		if (hits.some((h) => h.ruleId === 'wanderung')) return 'sport';
		if (hits.some((h) => h.ruleId === 'lagerbau')) return 'bau';
		return ctx.activity;
	}

	const budget = $derived.by(() =>
		plan
			? computeBudget(plan, {
					groups: ctx.groups,
					diet: ctx.diet,
					activity: ctx.activity,
					budgetPerPersonDay: ctx.budgetPerPersonDay
				})
			: null
	);

	const variety = $derived.by(() => {
		if (!plan) return [];
		return varietyWarnings(
			plan.days.map((d) => [d.slots.zmittag, d.slots.znacht].filter((x): x is string => x !== null))
		);
	});

	function mealTimes(dayIndex: number): string[] {
		return (program?.days[dayIndex]?.blocks ?? [])
			.filter((b) => b.category === 'ES' && b.start)
			.map((b) => b.start as string);
	}

	// Everything shown per day/meal, computed once.
	const days = $derived.by(() => {
		if (!program || !plan) return [];
		return plan.days.map((d, i) => {
			const activity = activityForDay(ruleHits[i] ?? []);
			const meals = MENU_SLOTS.map((slot) => {
				const rid = d.slots[slot];
				const recipe = recipeById(rid) ?? null;
				const effects = (ruleHits[i] ?? []).flatMap((h) =>
					h.effects.filter((e) => e.slot === slot).map((e) => ({ reason: e.reason, rule: h.label }))
				);
				const scaled = recipe
					? scaleRecipe(recipe, {
							groups: ctx.groups,
							activity,
							diet: ctx.diet,
							isFirstDay: i === 0
						})
					: null;
				const diet = recipe ? mealDietStatus(recipe, vegi) : null;
				const allergens = scaled
					? evaluateMeal(
							scaled.ingredients.map((x) => ({ name: x.name, allergens: x.allergens })),
							ctx.allergies
						)
					: null;
				const equip = scaled ? checkEquipment(scaled.cooking, ctx.equipment) : null;
				return { slot, rid, recipe, scaled, diet, allergens, equip, effects };
			});
			const notes = (ruleHits[i] ?? []).flatMap((h) =>
				h.effects.filter((e) => !e.slot).map((e) => ({ reason: e.reason, rule: h.label }))
			);
			return {
				index: i,
				date: d.date,
				activity,
				meals,
				notes,
				gaps: mealGapWarnings(mealTimes(i))
			};
		});
	});

	const DIET_BADGE: Record<string, { label: string; cls: string }> = {
		vegan: { label: 'Vegan', cls: 'bg-green-100 text-green-800' },
		vegetarian: { label: 'Vegetarisch', cls: 'bg-green-100 text-green-800' },
		'meat-with-vegi': { label: 'Fleisch + Vegi', cls: 'bg-gray-100 text-gray-600' },
		'meat-only': { label: 'Nur Fleisch', cls: 'bg-orange-100 text-orange-800' }
	};

	function fmt(a: number, u: 'g' | 'ml' | 'stk') {
		if (u === 'stk') return `${a} Stk`;
		if (u === 'g') return a >= 1000 ? `${(a / 1000).toFixed(2)} kg` : `${a} g`;
		return a >= 1000 ? `${(a / 1000).toFixed(2)} l` : `${a} ml`;
	}

	function regenerate() {
		if (program) session.plan = autoAssign(buildPlan(program), { vegiShare: vegi });
	}
	function clearAll() {
		if (program) session.plan = buildPlan(program);
	}
	function setSlot(di: number, slot: MealSlot, value: string) {
		if (session.plan) session.plan.days[di].slots[slot] = value || null;
	}

	let dragSrc = $state<{ day: number; slot: MealSlot } | null>(null);
	function onDrop(day: number, slot: MealSlot) {
		if (!session.plan || !dragSrc) return;
		const rid = session.plan.days[dragSrc.day].slots[dragSrc.slot];
		if (rid) {
			session.plan.days[day].slots[slot] = rid;
			if (!(dragSrc.day === day && dragSrc.slot === slot))
				session.plan.days[dragSrc.day].slots[dragSrc.slot] = null;
		}
		dragSrc = null;
	}
</script>

<svelte:head><title>Menüplan – Lagerküchen-Planer</title></svelte:head>

<div class="mx-auto max-w-6xl px-4 py-8">
	{#if !program}
		<h1 class="text-2xl font-bold text-gray-900">Menüplan</h1>
		<div class="mt-6 rounded-xl border border-gray-200 bg-white p-6">
			<p class="text-gray-700">Noch kein Programm geladen.</p>
			<a
				href="/import"
				class="mt-4 inline-flex rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
				>Zum Import →</a
			>
		</div>
	{:else if plan}
		<!-- Summary bar -->
		<div class="flex flex-wrap items-center gap-4 rounded-xl bg-gray-900 p-4 text-white">
			<div>
				<div class="text-xl font-bold">{heads}</div>
				<div class="text-[10px] text-gray-400 uppercase">Personen</div>
			</div>
			<div>
				<div class="text-xl font-bold">{Math.round(vegi * 100)}%</div>
				<div class="text-[10px] text-gray-400 uppercase">Vegi</div>
			</div>
			{#if budget}
				<div>
					<div
						class="text-xl font-bold {budget.plannedPerPersonDay <= budget.targetPerPersonDay
							? 'text-emerald-400'
							: 'text-orange-300'}"
					>
						CHF {budget.plannedPerPersonDay.toFixed(2)}
					</div>
					<div class="text-[10px] text-gray-400 uppercase">
						geplant/Pers./Tag · Ziel {budget.targetPerPersonDay}
					</div>
				</div>
			{/if}
			<div class="ml-auto flex flex-wrap gap-2">
				<a
					href="/lager"
					class="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/20"
					>Lager anpassen</a
				>
				<button
					class="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/20"
					onclick={regenerate}>Neu vorschlagen</button
				>
				<button
					class="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/20"
					onclick={clearAll}>Leeren</button
				>
				<a
					href="/einkauf"
					class="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold hover:bg-emerald-600"
					>Einkauf & Budget →</a
				>
			</div>
		</div>

		<p class="mt-3 text-sm text-gray-500">
			Mengen gelten <strong>pro Person</strong> und sind auf {heads} Personen hochgerechnet. Jede Zuteilung
			ist ein Vorschlag – per Auswahl oder Drag-and-Drop änderbar.
		</p>

		{#if variety.length}
			<ul
				class="mt-3 space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
			>
				{#each variety as v (`${v.day}-${v.dish}`)}
					<li>
						⚠️ «{recipeById(v.dish)?.name ?? v.dish}» wiederholt sich innerhalb von 4 Tagen (Tag {v.clashesWith +
							1} → Tag {v.day + 1}).
					</li>
				{/each}
			</ul>
		{/if}

		<div class="mt-6 space-y-5">
			{#each days as day (day.index)}
				<section class="overflow-hidden rounded-xl border border-gray-200 bg-white">
					<header
						class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5"
					>
						<h2 class="font-semibold text-gray-900">
							Tag {day.index + 1}{day.date ? ` · ${day.date}` : ''}
						</h2>
						<div class="flex flex-wrap gap-1">
							{#each ruleHits[day.index] ?? [] as h (h.ruleId)}
								<span
									class="rounded-full px-2 py-0.5 text-xs font-medium {h.confidence === 'sicher'
										? 'bg-sky-100 text-sky-800'
										: 'bg-gray-100 text-gray-600'}"
									title={h.triggeredBy}>{h.label}</span
								>
							{/each}
						</div>
					</header>

					{#if day.notes.length || day.gaps.length}
						<div class="border-b border-gray-50 px-4 py-2 text-xs text-amber-800">
							{#each day.notes as n, i (i)}<div>
									💡 {n.reason} <span class="text-amber-400">({n.rule})</span>
								</div>{/each}
							{#each day.gaps as g, i (i)}<div>⚠️ {g}</div>{/each}
						</div>
					{/if}

					<div class="grid gap-px bg-gray-100 sm:grid-cols-2 lg:grid-cols-3">
						{#each day.meals as m (m.slot)}
							<div
								class="bg-white p-3"
								role="group"
								ondragover={(e) => e.preventDefault()}
								ondrop={() => onDrop(day.index, m.slot)}
							>
								<div class="flex items-center justify-between">
									<span class="text-xs font-semibold text-gray-500 uppercase"
										>{SLOT_LABELS[m.slot]}</span
									>
									{#if m.recipe && m.diet}
										<span
											class="rounded-full px-1.5 py-0.5 text-[10px] font-medium {DIET_BADGE[
												m.diet.profile
											].cls}">{DIET_BADGE[m.diet.profile].label}</span
										>
									{/if}
								</div>

								<select
									class="mt-1 w-full rounded-lg border-gray-300 text-sm"
									value={m.rid ?? ''}
									onchange={(e) =>
										setSlot(day.index, m.slot, (e.target as HTMLSelectElement).value)}
								>
									<option value="">– leer –</option>
									{#each recipesForSlot(m.slot) as r (r.id)}<option value={r.id}>{r.name}</option
										>{/each}
								</select>

								{#if m.recipe && m.scaled && m.diet && m.allergens}
									<div
										class="mt-1.5 cursor-grab rounded bg-gray-50 px-2 py-1 text-xs text-gray-500"
										draggable="true"
										role="button"
										tabindex="0"
										ondragstart={() => (dragSrc = { day: day.index, slot: m.slot })}
									>
										⠿ ziehen, um zu verschieben
									</div>

									{#if !m.diet.ok && m.diet.hint}
										<div class="mt-1 rounded bg-orange-50 px-2 py-1 text-[11px] text-orange-800">
											🥗 {m.diet.hint}
										</div>
									{/if}
									{#if m.allergens.affected.length}
										<div class="mt-1 text-[11px] text-amber-700">
											Nicht essbar für: {m.allergens.affected.join(', ')}
										</div>
									{/if}
									{#each m.allergens.anaphylaxisWarnings as w, i (i)}
										<div
											class="mt-1 rounded border border-red-300 bg-red-50 p-1 text-[11px] text-red-800"
										>
											🚑 {w}
										</div>
									{/each}
									{#each m.effects as ef, i (i)}
										<div class="mt-1 text-[11px] text-sky-700" title={ef.rule}>→ {ef.reason}</div>
									{/each}

									<details class="mt-1.5">
										<summary class="cursor-pointer text-[11px] text-gray-400 hover:text-gray-600"
											>Mengen für {heads} Pers.</summary
										>
										<ul class="mt-1 space-y-0.5 text-[11px] text-gray-600">
											{#each m.scaled.ingredients as ing, ii (ii)}
												<li class="flex justify-between gap-2">
													<span>{ing.name}</span><span class="font-medium"
														>{fmt(ing.amount, ing.unit)}</span
													>
												</li>
											{/each}
										</ul>
										<div class="mt-1 text-[10px] text-gray-400">
											Kessel {m.scaled.cooking.kesselLiter} l · Rüsten {m.scaled.cooking
												.ruestPersonenminuten} Pers.-Min.
										</div>
										{#each m.equip as w (w.kind)}<div class="mt-0.5 text-[11px] text-red-700">
												⚠️ {w.message}
											</div>{/each}
									</details>
								{/if}
							</div>
						{/each}
					</div>
				</section>
			{/each}
		</div>
	{/if}
</div>
