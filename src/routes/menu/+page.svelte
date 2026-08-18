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
	import { evaluateProgram, toProgramDays } from '$lib/rules/engine';
	import { mealGapWarnings, varietyWarnings } from '$lib/rules/checks';
	import type { MealSlot } from '$lib/rules/types';

	const program = $derived(session.program);
	const plan = $derived(session.plan);

	$effect(() => {
		if (program && (!session.plan || session.plan.days.length !== program.days.length)) {
			session.plan = buildPlan(program);
		}
	});

	const ruleHits = $derived(program ? evaluateProgram(toProgramDays(program.days)) : []);

	const allEmpty = $derived(!!plan && plan.days.every((d) => MENU_SLOTS.every((s) => !d.slots[s])));

	const variety = $derived.by(() => {
		if (!plan) return [];
		const perDay = plan.days.map((d) =>
			[d.slots.zmittag, d.slots.znacht].filter((x): x is string => x !== null)
		);
		return varietyWarnings(perDay);
	});

	function mealTimesForDay(dayIndex: number): string[] {
		const day = program?.days[dayIndex];
		if (!day) return [];
		return day.blocks.filter((b) => b.category === 'ES' && b.start).map((b) => b.start as string);
	}

	function slotEffects(dayIndex: number, slot: MealSlot) {
		return (ruleHits[dayIndex] ?? []).flatMap((h) =>
			h.effects
				.filter((e) => e.slot === slot)
				.map((e) => ({ reason: e.reason, rule: h.label, confidence: h.confidence }))
		);
	}
	function dayNotes(dayIndex: number) {
		return (ruleHits[dayIndex] ?? []).flatMap((h) =>
			h.effects.filter((e) => !e.slot).map((e) => ({ reason: e.reason, rule: h.label }))
		);
	}

	function allergensOf(recipeId: string | null): string[] {
		const r = recipeById(recipeId);
		if (!r) return [];
		return [...new Set(r.ingredients.flatMap((i) => i.allergens))];
	}

	function autofill() {
		if (session.plan) session.plan = autoAssign(session.plan);
	}
	function clearAll() {
		if (program) session.plan = buildPlan(program);
	}

	// Drag-and-drop of a meal between days.
	let dragSrc = $state<{ day: number; slot: MealSlot } | null>(null);
	function onDrop(day: number, slot: MealSlot) {
		if (!plan || !dragSrc) return;
		const rid = plan.days[dragSrc.day].slots[dragSrc.slot];
		if (rid) {
			plan.days[day].slots[slot] = rid;
			if (!(dragSrc.day === day && dragSrc.slot === slot)) {
				plan.days[dragSrc.day].slots[dragSrc.slot] = null;
			}
		}
		dragSrc = null;
	}
</script>

<svelte:head>
	<title>Menüplan – Lagerküchen-Planer</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-8">
	<h1 class="text-2xl font-bold text-gray-900">Menüplan</h1>

	{#if !program}
		<div class="mt-6 rounded-lg border border-gray-200 bg-white p-6">
			<p class="text-gray-700">
				Noch kein Programm geladen. Importiere zuerst ein eCamp-PDF oder starte mit einer Vorlage.
			</p>
			<a
				href="/import"
				class="mt-4 inline-flex rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
			>
				Zum Import →
			</a>
		</div>
	{:else if plan}
		<p class="mt-1 text-gray-600">
			Vorschläge stammen aus dem Programm – jede automatische Entscheidung ist begründet und
			überschreibbar. Mahlzeiten lassen sich per Drag-and-Drop zwischen Tagen verschieben.
		</p>

		<div class="mt-4 flex flex-wrap gap-2">
			<button
				class="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
				onclick={autofill}>Vorschlag generieren</button
			>
			<button
				class="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
				onclick={clearAll}>Zurücksetzen</button
			>
			<a
				href="/mengen"
				class="ml-auto inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
				>Mengen & Allergene →</a
			>
		</div>

		{#if allEmpty}
			<div class="mt-4 rounded-md border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
				👉 Noch nichts geplant. Klicke <strong>«Vorschlag generieren»</strong> für einen automatischen
				Menüplan – oder wähle unten pro Mahlzeit selbst ein Gericht.
			</div>
		{/if}

		{#if variety.length}
			<ul
				class="mt-4 space-y-1 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
			>
				{#each variety as v (`${v.day}-${v.dish}`)}
					<li>
						⚠️ Abwechslung: «{recipeById(v.dish)?.name ?? v.dish}» wiederholt sich innerhalb von 4
						Tagen (Tag {v.clashesWith + 1} → Tag {v.day + 1}).
					</li>
				{/each}
			</ul>
		{/if}

		<div class="mt-6 space-y-6">
			{#each plan.days as day, di (di)}
				{@const notes = dayNotes(di)}
				{@const gaps = mealGapWarnings(mealTimesForDay(di))}
				<section class="rounded-lg border border-gray-200 bg-white">
					<header
						class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 p-3"
					>
						<h2 class="font-semibold text-gray-900">
							Tag {di + 1}{day.date ? ` · ${day.date}` : ''}
						</h2>
						<div class="flex flex-wrap gap-1">
							{#each ruleHits[di] ?? [] as h (h.ruleId)}
								<span
									class="rounded-full px-2 py-0.5 text-xs font-medium {h.confidence === 'sicher'
										? 'bg-sky-100 text-sky-800'
										: 'bg-gray-100 text-gray-600'}"
									title={h.triggeredBy}>{h.label}</span
								>
							{/each}
						</div>
					</header>

					{#if notes.length || gaps.length}
						<div class="border-b border-gray-50 px-3 py-2 text-xs text-amber-800">
							{#each notes as n, i (i)}<div>
									💡 {n.reason} <span class="text-amber-500">({n.rule})</span>
								</div>{/each}
							{#each gaps as g, i (i)}<div>⚠️ {g}</div>{/each}
						</div>
					{/if}

					<div class="grid gap-px bg-gray-100 sm:grid-cols-2 lg:grid-cols-3">
						{#each MENU_SLOTS as slot (slot)}
							{@const effects = slotEffects(di, slot)}
							{@const rid = day.slots[slot]}
							<div
								class="bg-white p-3"
								role="group"
								ondragover={(e) => e.preventDefault()}
								ondrop={() => onDrop(di, slot)}
							>
								<div class="text-xs font-semibold text-gray-500 uppercase">{SLOT_LABELS[slot]}</div>

								<select
									class="mt-1 w-full rounded border-gray-300 text-sm"
									value={rid ?? ''}
									onchange={(e) =>
										(day.slots[slot] = (e.target as HTMLSelectElement).value || null)}
								>
									<option value="">– leer –</option>
									{#each recipesForSlot(slot) as r (r.id)}
										<option value={r.id}>{r.name}</option>
									{/each}
								</select>

								{#if rid}
									<div
										class="mt-2 cursor-grab rounded bg-gray-50 px-2 py-1 text-xs text-gray-600"
										draggable="true"
										role="button"
										tabindex="0"
										ondragstart={() => (dragSrc = { day: di, slot })}
									>
										⠿ {recipeById(rid)?.name}
										{#if allergensOf(rid).length}
											<div class="mt-0.5 text-[10px] text-gray-400">
												Allergene: {allergensOf(rid).join(', ')}
											</div>
										{/if}
									</div>
								{/if}

								{#each effects as ef, i (i)}
									<div class="mt-1 text-[11px] text-sky-700" title={ef.rule}>→ {ef.reason}</div>
								{/each}
							</div>
						{/each}
					</div>
				</section>
			{/each}
		</div>
	{/if}
</div>
