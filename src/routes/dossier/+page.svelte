<script lang="ts">
	import { session } from '$lib/stores/session.svelte';
	import { MENU_SLOTS, recipeById, SLOT_LABELS } from '$lib/menu/plan';
	import { scaleRecipe } from '$lib/recipes/scale';
	import { buildShoppingList } from '$lib/shopping/aggregate';
	import { STORE_LABELS } from '$lib/shopping/types';
	import { computeBudget } from '$lib/budget/budget';
	import { cookingWindow, wakeUpTime } from '$lib/quantities/timing';
	import { allergenLabel } from '$lib/allergens/data';

	const plan = $derived(session.plan);
	const program = $derived(session.program);
	const ctx = session.context;

	function fmt(amount: number, unit: 'g' | 'ml' | 'stk'): string {
		if (unit === 'stk') return `${amount} Stk`;
		if (unit === 'g') return amount >= 1000 ? `${(amount / 1000).toFixed(2)} kg` : `${amount} g`;
		return amount >= 1000 ? `${(amount / 1000).toFixed(2)} l` : `${amount} ml`;
	}

	const days = $derived.by(() => {
		if (!plan) return [];
		return plan.days.map((d, i) => {
			const meals = MENU_SLOTS.map((slot) => {
				const recipe = recipeById(d.slots[slot]);
				if (!recipe) return null;
				const scaled = scaleRecipe(recipe, {
					groups: ctx.groups,
					activity: ctx.activity,
					diet: ctx.diet,
					isFirstDay: i === 0
				});
				// Reverse schedule for warm meals with a known ES time.
				const esBlock = program?.days[i]?.blocks.find(
					(b) => b.category === 'ES' && b.start && b.title.toLowerCase().includes(slot)
				);
				const mealTime = esBlock?.start ?? null;
				const prep = recipe.cooking.ruestBasisMin + 45; // rough wall-clock lead
				const schedule = mealTime
					? {
							meal: mealTime,
							...cookingWindow(mealTime, prep),
							wake: wakeUpTime(mealTime, prep, 15).time
						}
					: null;
				return { slot, recipe, scaled, schedule };
			}).filter((m) => m !== null);
			return { index: i, date: d.date, meals };
		});
	});

	const shopping = $derived.by(() =>
		plan
			? buildShoppingList(
					plan,
					{ groups: ctx.groups, diet: ctx.diet, activity: ctx.activity, equipment: ctx.equipment },
					{ grossverbraucher: ctx.grossverbraucher, dates: program?.days.map((d) => d.date) }
				)
			: null
	);

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

	const dryStore = $derived(
		shopping?.runs.find((r) => r.id === 'vor')?.byCategory.flatMap((c) => c.items) ?? []
	);
</script>

<svelte:head>
	<title>Küchendossier – Lagerküchen-Planer</title>
</svelte:head>

<div class="dossier">
	<div class="no-print controls">
		<button onclick={() => window.print()}>Drucken / als PDF speichern</button>
		<a href="/einkauf">← zurück</a>
		<span>Tipp: im Druckdialog «Hintergrundgrafiken» aus, Ränder normal.</span>
	</div>

	{#if !plan}
		<p>Kein Menüplan vorhanden. <a href="/menu">Zum Menüplan</a>.</p>
	{:else}
		<!-- 1. Deckblatt -->
		<section class="sheet">
			<h1>Küchendossier</h1>
			<p class="lead">
				{program?.camp ? `Camp ${program.camp}` : 'Lager'} · {plan.days.length} Tage
			</p>
			<table class="notfall">
				<tbody>
					<tr><th>Sanitätsnotruf</th><td>144</td></tr>
					<tr><th>Vergiftungsnotruf (Tox)</th><td>145</td></tr>
					<tr><th>Lagerleitung</th><td>________________________</td></tr>
					<tr><th>Küchenchef:in</th><td>________________________</td></tr>
					<tr><th>Nächster Arzt / Spital</th><td>________________________</td></tr>
				</tbody>
			</table>
			<p class="hint">
				Allergiedaten sind pseudonymisiert. Die Zuordnungsliste bleibt beim Lagerleiter auf Papier.
			</p>
		</section>

		<!-- 2. Allergie-Blatt -->
		<section class="sheet">
			<h2>Allergie-Blatt (aufhängen)</h2>
			{#if ctx.allergies.length === 0}
				<p>Keine Allergien erfasst.</p>
			{:else}
				<table class="big grid">
					<thead>
						<tr
							><th>Pseudonym</th><th>Schweregrad</th><th>Allergene</th><th
								>Klarname (handschriftlich)</th
							></tr
						>
					</thead>
					<tbody>
						{#each ctx.allergies as a (a.pseudonym)}
							<tr class={a.severity === 'anaphylaxie' ? 'severe' : ''}>
								<td class="mono">{a.pseudonym}</td>
								<td>{a.severity}{a.severity === 'anaphylaxie' ? ' ⚠' : ''}</td>
								<td>{a.allergens.map(allergenLabel).join(', ')}</td>
								<td></td>
							</tr>
						{/each}
					</tbody>
				</table>
				<p class="hint">
					Bei Anaphylaxie: Kreuzkontamination vermeiden, separates Schneidbrett, Notfallmedikament
					bereit. Verantwortung bei der Lagerleitung, Rücksprache mit den Eltern.
				</p>
			{/if}
		</section>

		<!-- 3. Menü-Übersicht -->
		<section class="sheet">
			<h2>Menü-Übersicht</h2>
			<table class="grid">
				<thead>
					<tr
						><th>Tag</th>{#each MENU_SLOTS as s (s)}<th>{SLOT_LABELS[s]}</th>{/each}</tr
					>
				</thead>
				<tbody>
					{#each days as day (day.index)}
						<tr>
							<td><strong>{day.index + 1}</strong>{day.date ? `\n${day.date}` : ''}</td>
							{#each MENU_SLOTS as s (s)}
								<td>{day.meals.find((m) => m.slot === s)?.recipe.name ?? '–'}</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</section>

		<!-- 4. Kochtag-Blätter -->
		{#each days as day (day.index)}
			<section class="sheet">
				<h2>Kochtag {day.index + 1}{day.date ? ` · ${day.date}` : ''}</h2>
				{#if day.meals.length === 0}
					<p>Keine Gerichte zugeteilt.</p>
				{/if}
				{#each day.meals as m (m.slot)}
					<div class="meal">
						<h3>{SLOT_LABELS[m.slot]}: {m.recipe.name}</h3>
						{#if m.schedule}
							<p class="sched">
								Aufstehen/Rüsten {m.schedule.wake} · Kochbeginn {m.schedule.start} · Essen {m
									.schedule.meal}
							</p>
						{/if}
						<table class="tight grid">
							<tbody>
								{#each m.scaled.ingredients as ing, ii (ii)}
									<tr><td>{ing.name}</td><td class="num">{fmt(ing.amount, ing.unit)}</td></tr>
								{/each}
							</tbody>
						</table>
						<p class="steps">
							{#each m.recipe.steps as step, i (i)}<span>{i + 1}. {step} </span>{/each}
						</p>
						<p class="kessel">
							Kessel {m.scaled.cooking.kesselLiter} l · {m.scaled.cooking.kochstellen} Kochstellen · Rüsten
							{m.scaled.cooking.ruestPersonenminuten} Pers.-Min.
						</p>
					</div>
				{/each}
				<p class="aemtli">
					Ämtli: Kochen ____________ · Rüsten ____________ · Abwasch ____________<br />Vorbereitung
					Folgetag: ______________________________________________
				</p>
			</section>
		{/each}

		<!-- 5. Einkaufsblätter -->
		{#if shopping}
			{#each shopping.runs as run (run.id)}
				<section class="sheet">
					<h2>Einkauf: {run.label}</h2>
					{#if run.fridgeWarning}<p class="warn">⚠ {run.fridgeWarning}</p>{/if}
					{#each run.byCategory as cat (cat.category)}
						<h3>{STORE_LABELS[cat.category]}</h3>
						<table class="tight grid">
							<tbody>
								{#each cat.items as item (item.name)}
									<tr
										><td class="check">☐</td><td>{item.packs} × {item.packLabel}</td><td
											>{item.name}</td
										><td class="num">{fmt(item.purchased, item.unit)}</td></tr
									>
								{/each}
							</tbody>
						</table>
					{/each}
				</section>
			{/each}
		{/if}

		<!-- 6. Inventar Trockenlager -->
		<section class="sheet">
			<h2>Inventar Trockenlager</h2>
			<table class="tight grid">
				<tbody>
					{#each dryStore as item, ii (ii)}
						<tr
							><td class="check">☐</td><td>{item.name}</td><td class="num"
								>{fmt(item.purchased, item.unit)}</td
							><td>Rest: ______</td></tr
						>
					{/each}
				</tbody>
			</table>
		</section>

		<!-- 7. Budgetblatt -->
		{#if budget}
			<section class="sheet">
				<h2>Budget</h2>
				<p>
					Geplant total <strong>CHF {budget.plannedTotal.toFixed(2)}</strong> · Ziel CHF {budget.targetTotal.toFixed(
						2
					)} · {budget.personDays} Personentage
				</p>
				<p>
					Pro Person/Tag: geplant CHF {budget.plannedPerPersonDay.toFixed(2)} / Ziel CHF {budget.targetPerPersonDay.toFixed(
						2
					)}
				</p>
				<table class="tight grid">
					<thead><tr><th>Tag</th><th>geplant</th><th>Ist-Kosten (handschriftlich)</th></tr></thead>
					<tbody>
						{#each budget.days as d (d.index)}
							<tr
								><td>{d.index + 1}{d.date ? ` · ${d.date}` : ''}</td><td class="num"
									>CHF {d.total.toFixed(2)}</td
								><td>____________</td></tr
							>
						{/each}
					</tbody>
				</table>
				<p class="hint">
					Preise sind Schätzwerte – Ist-Kosten nach dem Lager für die Vereinskasse eintragen.
				</p>
			</section>
		{/if}
	{/if}
</div>

<style>
	.dossier {
		max-width: 800px;
		margin: 0 auto;
		padding: 1rem;
		color: #000;
		font-size: 11pt;
		line-height: 1.35;
	}
	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: center;
		margin-bottom: 1rem;
		font-size: 0.85rem;
		color: #555;
	}
	.controls button {
		background: #0284c7;
		color: #fff;
		border: none;
		border-radius: 0.375rem;
		padding: 0.5rem 1rem;
		font-weight: 600;
		cursor: pointer;
	}
	.sheet {
		border: 1px solid #ccc;
		border-radius: 0.5rem;
		padding: 1.25rem;
		margin-bottom: 1.25rem;
		background: #fff;
	}
	h1 {
		font-size: 1.8rem;
		font-weight: 700;
	}
	h2 {
		font-size: 1.3rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}
	h3 {
		font-size: 1.05rem;
		font-weight: 600;
		margin-top: 0.75rem;
	}
	.lead {
		font-size: 1.1rem;
		margin: 0.25rem 0 1rem;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		margin: 0.25rem 0;
	}
	.grid th,
	.grid td {
		border: 1px solid #999;
		padding: 0.25rem 0.4rem;
		text-align: left;
		vertical-align: top;
		white-space: pre-line;
	}
	.grid.big th,
	.grid.big td {
		font-size: 1.05rem;
		padding: 0.5rem;
	}
	.grid.tight td {
		padding: 0.15rem 0.35rem;
	}
	.num {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	.mono {
		font-family: ui-monospace, monospace;
	}
	.severe {
		font-weight: 700;
	}
	.notfall th {
		text-align: left;
		padding: 0.3rem 0.6rem 0.3rem 0;
	}
	.notfall td {
		padding: 0.3rem 0;
	}
	.meal {
		margin-bottom: 0.75rem;
		break-inside: avoid;
	}
	.sched {
		font-weight: 600;
	}
	.steps {
		font-size: 0.95em;
	}
	.kessel,
	.hint {
		font-size: 0.85em;
		color: #444;
	}
	.aemtli {
		margin-top: 0.75rem;
		font-size: 0.9em;
	}
	.warn {
		font-weight: 700;
	}
	.check {
		font-size: 1.1em;
	}

	@media print {
		.no-print {
			display: none;
		}
		.dossier {
			max-width: none;
			padding: 0;
		}
		.sheet {
			border: none;
			border-radius: 0;
			padding: 0;
			margin: 0;
			page-break-after: always;
		}
		.meal {
			page-break-inside: avoid;
		}
	}
</style>
