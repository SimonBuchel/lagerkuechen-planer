<script lang="ts">
	import { session } from '$lib/stores/session.svelte';
	import { MENU_SLOTS, recipeById, SLOT_LABELS } from '$lib/menu/plan';
	import { scaleRecipe } from '$lib/recipes/scale';
	import { buildShoppingList } from '$lib/shopping/aggregate';
	import { STORE_LABELS } from '$lib/shopping/types';
	import { computeBudget } from '$lib/budget/budget';
	import { cookingWindow, wakeUpTime } from '$lib/quantities/timing';
	import { allergenLabel } from '$lib/allergens/data';
	import { totalHeadcount } from '$lib/quantities/scale';
	import {
		CAMP_TYPE_LABELS,
		SEASON_LABELS,
		recipeDietProfile,
		vegiPortions
	} from '$lib/menu/diet';

	const plan = $derived(session.plan);
	const program = $derived(session.program);
	const ctx = session.context;

	const heads = $derived(totalHeadcount(ctx.groups));
	const vegiCount = $derived(vegiPortions(ctx.diet.vegetarisch, ctx.diet.vegan));
	const largestKettle = $derived(
		ctx.equipment.kesselLiter.length ? Math.max(...ctx.equipment.kesselLiter) : 0
	);

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
				const esBlock = program?.days[i]?.blocks.find(
					(b) => b.category === 'ES' && b.start && b.title.toLowerCase().includes(slot)
				);
				const mealTime = esBlock?.start ?? null;
				const prep = recipe.cooking.ruestBasisMin + 45;
				const schedule = mealTime
					? {
							meal: mealTime,
							...cookingWindow(mealTime, prep),
							wake: wakeUpTime(mealTime, prep, 15).time
						}
					: null;
				const profile = recipeDietProfile(recipe);
				const needsVegi = (profile === 'meat-with-vegi' || profile === 'meat-only') && vegiCount > 0;
				return { slot, recipe, scaled, schedule, needsVegi };
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
		<button onclick={() => window.print()}>🖨 Drucken / als PDF speichern</button>
		<a href="/einkauf">← zurück</a>
		<span>Tipp: Ränder «normal», Hintergrundgrafiken nicht nötig – Farben sind druckfest gesetzt.</span>
	</div>

	{#if !plan}
		<p class="empty">
			Kein Menüplan vorhanden. <a href="/menu">Zum Menüplan →</a>
		</p>
	{:else}
		<!-- 1. Deckblatt -->
		<section class="sheet cover">
			<div class="cover-head">
				<div class="brand">🍲 Lagerküche</div>
				<h1>Küchendossier</h1>
				<p class="lead">{program?.camp ? `Camp ${program.camp}` : 'Lager'} · {plan.days.length} Tage</p>
			</div>

			<div class="meta">
				<div><span class="k">Personen</span><span class="v">{heads}</span></div>
				<div><span class="k">Vegetarisch</span><span class="v">{ctx.diet.vegetarisch}</span></div>
				<div><span class="k">Vegan</span><span class="v">{ctx.diet.vegan}</span></div>
				<div><span class="k">Allergien</span><span class="v">{ctx.allergies.length}</span></div>
				<div><span class="k">Saison</span><span class="v">{SEASON_LABELS[ctx.season]}</span></div>
				<div><span class="k">Lagerart</span><span class="v">{CAMP_TYPE_LABELS[ctx.campType]}</span></div>
				<div><span class="k">Ofen</span><span class="v">{ctx.equipment.backofen ? 'ja' : 'nein'}</span></div>
				<div><span class="k">Grösster Kessel</span><span class="v">{largestKettle} l</span></div>
				<div><span class="k">Budget/Pers./Tag</span><span class="v">CHF {ctx.budgetPerPersonDay}</span></div>
			</div>

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
			<h2>Allergie-Blatt <span class="sub">– gut sichtbar aufhängen</span></h2>
			{#if ctx.allergies.length === 0}
				<p>Keine Allergien erfasst.</p>
			{:else}
				<table class="big grid">
					<thead>
						<tr>
							<th>Pseudonym</th><th>Schweregrad</th><th>Allergene</th>
							<th>Klarname (handschriftlich)</th>
						</tr>
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
			<table class="grid overview">
				<thead>
					<tr><th>Tag</th>{#each MENU_SLOTS as s (s)}<th>{SLOT_LABELS[s]}</th>{/each}</tr>
				</thead>
				<tbody>
					{#each days as day (day.index)}
						<tr>
							<td class="daycell"><strong>Tag {day.index + 1}</strong>{day.date ? `\n${day.date}` : ''}</td>
							{#each MENU_SLOTS as s (s)}
								<td>{day.meals.find((m) => m.slot === s)?.recipe.name ?? '–'}</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
			<p class="hint">Mengen auf {heads} Personen. Vegi-Varianten stehen auf den Kochtag-Blättern.</p>
		</section>

		<!-- 4. Kochtag-Blätter -->
		{#each days as day (day.index)}
			<section class="sheet">
				<h2>Kochtag {day.index + 1}<span class="sub">{day.date ? ` · ${day.date}` : ''}</span></h2>
				{#if day.meals.length === 0}
					<p>Keine Gerichte zugeteilt.</p>
				{/if}
				{#each day.meals as m (m.slot)}
					<div class="meal">
						<h3><span class="slot">{SLOT_LABELS[m.slot]}</span> {m.recipe.name}</h3>
						{#if m.schedule}
							<p class="sched">
								⏰ Aufstehen/Rüsten {m.schedule.wake} · Kochbeginn {m.schedule.start} · Essen {m
									.schedule.meal}
							</p>
						{/if}
						{#if m.needsVegi}
							<p class="vegi">🥗 Vegi-Variante separat für {vegiCount} Person(en) zubereiten.</p>
						{/if}
						<table class="tight grid">
							<tbody>
								{#each m.scaled.ingredients as ing, ii (ii)}
									<tr><td>{ing.name}</td><td class="num">{fmt(ing.amount, ing.unit)}</td></tr>
								{/each}
							</tbody>
						</table>
						<ol class="steps">
							{#each m.recipe.steps as step, i (i)}<li>{step}</li>{/each}
						</ol>
						<p class="kessel">
							Kessel {m.scaled.cooking.kesselLiter} l · {m.scaled.cooking.kochstellen} Kochstellen · Rüsten
							{m.scaled.cooking.ruestPersonenminuten} Pers.-Min.
						</p>
					</div>
				{/each}
				<p class="aemtli">
					Ämtli: Kochen ____________ · Rüsten ____________ · Abwasch ____________<br />
					Vorbereitung Folgetag: ______________________________________________
				</p>
			</section>
		{/each}

		<!-- 5. Einkaufsblätter -->
		{#if shopping}
			{#each shopping.runs as run (run.id)}
				<section class="sheet">
					<h2>Einkauf<span class="sub"> · {run.label}</span></h2>
					{#if run.fridgeWarning}<p class="warn">⚠ {run.fridgeWarning}</p>{/if}
					{#each run.byCategory as cat (cat.category)}
						<h3>{STORE_LABELS[cat.category]}</h3>
						<table class="tight grid shop">
							<tbody>
								{#each cat.items as item (item.name)}
									<tr>
										<td class="check">☐</td>
										<td class="qty">{item.packs} × {item.packLabel}</td>
										<td>{item.name}</td>
										<td class="num">{fmt(item.purchased, item.unit)}</td>
									</tr>
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
						<tr>
							<td class="check">☐</td>
							<td>{item.name}</td>
							<td class="num">{fmt(item.purchased, item.unit)}</td>
							<td>Rest: ______</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</section>

		<!-- 7. Budgetblatt -->
		{#if budget}
			<section class="sheet">
				<h2>Budget</h2>
				<div class="meta small">
					<div><span class="k">Geplant total</span><span class="v">CHF {budget.plannedTotal.toFixed(2)}</span></div>
					<div><span class="k">Ziel total</span><span class="v">CHF {budget.targetTotal.toFixed(2)}</span></div>
					<div><span class="k">Pro Pers./Tag</span><span class="v">CHF {budget.plannedPerPersonDay.toFixed(2)}</span></div>
					<div><span class="k">Personentage</span><span class="v">{budget.personDays}</span></div>
				</div>
				<table class="tight grid">
					<thead><tr><th>Tag</th><th>geplant</th><th>Ist-Kosten (handschriftlich)</th></tr></thead>
					<tbody>
						{#each budget.days as d (d.index)}
							<tr>
								<td>Tag {d.index + 1}{d.date ? ` · ${d.date}` : ''}</td>
								<td class="num">CHF {d.total.toFixed(2)}</td>
								<td>____________</td>
							</tr>
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
		max-width: 820px;
		margin: 0 auto;
		padding: 1rem;
		color: #111;
		font-size: 11pt;
		line-height: 1.4;
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
		border-radius: 0.5rem;
		padding: 0.5rem 1rem;
		font-weight: 600;
		cursor: pointer;
	}
	.controls a {
		color: #0284c7;
		text-decoration: none;
		font-weight: 600;
	}
	.empty {
		padding: 2rem;
		text-align: center;
		color: #444;
	}
	.sheet {
		border: 1px solid #e2e2e2;
		border-radius: 0.6rem;
		padding: 1.4rem 1.5rem;
		margin-bottom: 1.25rem;
		background: #fff;
	}
	h1 {
		font-size: 2rem;
		font-weight: 800;
		letter-spacing: -0.01em;
		margin: 0.2rem 0;
	}
	h2 {
		font-size: 1.3rem;
		font-weight: 700;
		margin: 0 0 0.7rem;
		padding-left: 0.6rem;
		border-left: 4px solid #0284c7;
		color: #0f172a;
	}
	h3 {
		font-size: 1.02rem;
		font-weight: 600;
		margin: 0.8rem 0 0.3rem;
	}
	.sub {
		font-weight: 500;
		color: #64748b;
	}
	/* Cover */
	.cover-head {
		border-bottom: 3px solid #0284c7;
		padding-bottom: 0.8rem;
		margin-bottom: 1rem;
	}
	.brand {
		font-weight: 700;
		color: #0284c7;
		font-size: 0.95rem;
	}
	.lead {
		font-size: 1.1rem;
		color: #475569;
		margin: 0.25rem 0 0;
	}
	.meta {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem 1rem;
		margin: 0 0 1.2rem;
	}
	.meta.small {
		grid-template-columns: repeat(4, 1fr);
		margin-bottom: 0.8rem;
	}
	.meta > div {
		display: flex;
		flex-direction: column;
		border-left: 3px solid #e2e8f0;
		padding-left: 0.55rem;
	}
	.meta .k {
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: #64748b;
	}
	.meta .v {
		font-size: 1.2rem;
		font-weight: 700;
		color: #0f172a;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		margin: 0.25rem 0;
	}
	.grid th,
	.grid td {
		border: 1px solid #cbd5e1;
		padding: 0.28rem 0.45rem;
		text-align: left;
		vertical-align: top;
		white-space: pre-line;
	}
	.grid thead th {
		background: #f1f5f9;
		font-size: 0.82rem;
	}
	.grid.big th,
	.grid.big td {
		font-size: 1.05rem;
		padding: 0.5rem;
	}
	.grid.tight td {
		padding: 0.16rem 0.4rem;
	}
	.overview td:first-child,
	.daycell {
		white-space: pre-line;
		background: #f8fafc;
	}
	.shop .qty {
		font-weight: 700;
		white-space: nowrap;
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
		color: #b91c1c;
	}
	.notfall {
		max-width: 26rem;
	}
	.notfall th {
		text-align: left;
		padding: 0.3rem 0.6rem 0.3rem 0;
		font-weight: 600;
	}
	.notfall td {
		padding: 0.3rem 0;
	}
	.meal {
		margin-bottom: 1rem;
		padding-bottom: 0.6rem;
		border-bottom: 1px dashed #e2e8f0;
		break-inside: avoid;
	}
	.meal:last-of-type {
		border-bottom: none;
	}
	.slot {
		display: inline-block;
		background: #0284c7;
		color: #fff;
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		padding: 0.1rem 0.4rem;
		border-radius: 0.3rem;
		vertical-align: middle;
		margin-right: 0.35rem;
	}
	.sched {
		font-weight: 600;
		color: #0f172a;
		margin: 0.2rem 0;
	}
	.vegi {
		display: inline-block;
		background: #ecfdf5;
		border: 1px solid #a7f3d0;
		color: #065f46;
		font-size: 0.85em;
		padding: 0.1rem 0.5rem;
		border-radius: 0.3rem;
		margin: 0.2rem 0;
	}
	.steps {
		font-size: 0.95em;
		margin: 0.4rem 0 0.3rem 1.1rem;
	}
	.steps li {
		margin-bottom: 0.1rem;
	}
	.kessel,
	.hint {
		font-size: 0.85em;
		color: #475569;
	}
	.aemtli {
		margin-top: 0.9rem;
		font-size: 0.9em;
		color: #334155;
	}
	.warn {
		font-weight: 700;
		color: #b45309;
	}
	.check {
		font-size: 1.1em;
		width: 1.4rem;
	}

	@media print {
		.no-print {
			display: none;
		}
		.dossier {
			max-width: none;
			padding: 0;
			font-size: 10.5pt;
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
		.slot {
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}
	}
</style>
