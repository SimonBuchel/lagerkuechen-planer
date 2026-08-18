<script lang="ts">
	import { session } from '$lib/stores/session.svelte';
	import { buildShoppingList } from '$lib/shopping/aggregate';
	import { STORE_LABELS } from '$lib/shopping/types';
	import { computeBudget } from '$lib/budget/budget';

	const plan = $derived(session.plan);
	const program = $derived(session.program);
	const ctx = session.context;

	const shopping = $derived.by(() => {
		if (!plan) return null;
		return buildShoppingList(
			plan,
			{
				groups: ctx.groups,
				diet: ctx.diet,
				activity: ctx.activity,
				equipment: ctx.equipment,
				allergies: ctx.allergies
			},
			{ grossverbraucher: ctx.grossverbraucher, dates: program?.days.map((d) => d.date) }
		);
	});

	const budget = $derived.by(() => {
		if (!plan) return null;
		return computeBudget(plan, {
			groups: ctx.groups,
			diet: ctx.diet,
			activity: ctx.activity,
			budgetPerPersonDay: ctx.budgetPerPersonDay
		});
	});

	// Offline check state, persisted in localStorage.
	const STORAGE_KEY = 'einkauf-checked';
	let checked = $state<Set<string>>(new Set());
	$effect(() => {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) checked = new Set(JSON.parse(raw));
		} catch {
			/* ignore */
		}
	});
	function toggle(key: string) {
		const next = new Set(checked);
		if (next.has(key)) next.delete(key);
		else next.add(key);
		checked = next;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
		} catch {
			/* ignore */
		}
	}

	function fmt(amount: number, unit: 'g' | 'ml' | 'stk'): string {
		if (unit === 'stk') return `${amount} Stk`;
		if (unit === 'g') return amount >= 1000 ? `${(amount / 1000).toFixed(2)} kg` : `${amount} g`;
		return amount >= 1000 ? `${(amount / 1000).toFixed(2)} l` : `${amount} ml`;
	}

	function asText(): string {
		if (!shopping) return '';
		const lines: string[] = ['*Einkaufsliste – Lagerküchen-Planer*', ''];
		for (const run of shopping.runs) {
			lines.push(`*${run.label}*`);
			for (const cat of run.byCategory) {
				lines.push(`_${STORE_LABELS[cat.category]}_`);
				for (const item of cat.items) {
					lines.push(
						`• ${item.name}: ${item.packs} × ${item.packLabel} (Bedarf ${fmt(item.needed, item.unit)})`
					);
				}
			}
			lines.push('');
		}
		return lines.join('\n');
	}

	function asCsv(): string {
		const rows = [['Einkauf', 'Kategorie', 'Artikel', 'Anzahl', 'Gebinde', 'Bedarf', 'Gekauft']];
		for (const run of shopping?.runs ?? []) {
			for (const cat of run.byCategory) {
				for (const item of cat.items) {
					rows.push([
						run.label,
						STORE_LABELS[cat.category],
						item.name,
						String(item.packs),
						item.packLabel,
						fmt(item.needed, item.unit),
						fmt(item.purchased, item.unit)
					]);
				}
			}
		}
		return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
	}

	function download(content: string, filename: string, type: string) {
		const blob = new Blob([content], { type });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	}

	let copied = $state(false);
	async function copyWhatsApp() {
		try {
			await navigator.clipboard.writeText(asText());
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			download(asText(), 'einkaufsliste.txt', 'text/plain');
		}
	}
</script>

<svelte:head>
	<title>Einkauf & Budget – Lagerküchen-Planer</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-8">
	{#if !plan}
		<h1 class="text-2xl font-bold text-gray-900">Einkauf & Budget</h1>
		<div class="mt-6 rounded-xl border border-gray-200 bg-white p-6 text-gray-700">
			Kein Menüplan vorhanden.
			<a class="font-medium text-sky-700 hover:underline" href="/menu">Zum Menüplan →</a>
		</div>
	{:else}
		<!-- Summary bar (matches Lager/Menü) -->
		<div class="flex flex-wrap items-center gap-5 rounded-xl bg-gray-900 p-4 text-white">
			{#if budget}
				<div>
					<div class="text-xl font-bold">CHF {budget.plannedTotal.toFixed(2)}</div>
					<div class="text-[10px] text-gray-400 uppercase">Einkauf total geplant</div>
				</div>
				<div>
					<div
						class="text-xl font-bold {budget.plannedPerPersonDay <= budget.targetPerPersonDay
							? 'text-emerald-400'
							: 'text-orange-300'}"
					>
						CHF {budget.plannedPerPersonDay.toFixed(2)}
					</div>
					<div class="text-[10px] text-gray-400 uppercase">
						pro Pers./Tag · Ziel {budget.targetPerPersonDay.toFixed(2)}
					</div>
				</div>
				<div>
					<div class="text-xl font-bold">{budget.personDays}</div>
					<div class="text-[10px] text-gray-400 uppercase">Personentage</div>
				</div>
			{/if}
			<div class="ml-auto flex flex-wrap gap-2">
				<a
					href="/menu"
					class="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/20">Menüplan</a
				>
				<button
					class="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/20"
					onclick={() => download(asCsv(), 'einkaufsliste.csv', 'text/csv')}>CSV</button
				>
				<button
					class="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold hover:bg-emerald-600"
					onclick={copyWhatsApp}>{copied ? 'Kopiert ✓' : 'WhatsApp-Text'}</button
				>
			</div>
		</div>

		<p class="mt-3 text-sm text-gray-500">
			Nach <strong>Einkaufstag</strong> und Ladenkategorie gruppiert, in Gebinden gerundet – zum
			Abhaken im Laden (offline). Preise sind Schätzwerte.
		</p>

		<!-- Options -->
		<div
			class="mt-4 flex flex-wrap items-center gap-5 rounded-xl border border-gray-200 bg-white p-4 text-sm"
		>
			<label class="flex items-center gap-2 text-gray-700">
				<input type="checkbox" class="rounded" bind:checked={ctx.grossverbraucher} />
				Grossverbraucher-Gebinde
			</label>
			<label class="flex items-center gap-2 text-gray-700">
				Budget CHF/Person/Tag
				<input
					type="number"
					min="0"
					step="0.5"
					class="w-20 rounded-lg border-gray-300"
					bind:value={ctx.budgetPerPersonDay}
				/>
			</label>
		</div>

		<!-- Shopping runs -->
		{#if shopping}
			<div class="mt-6 space-y-5">
				{#each shopping.runs as run (run.id)}
					<section class="overflow-hidden rounded-xl border border-gray-200 bg-white">
						<header
							class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5"
						>
							<h2 class="font-semibold text-gray-900">🛒 {run.label}</h2>
							{#if run.fridgeLiters > 0}
								<span class="text-xs text-gray-400"
									>Frischvolumen ~{run.fridgeLiters.toFixed(0)} l</span
								>
							{/if}
						</header>
						{#if run.fridgeWarning}
							<div class="border-b border-gray-50 bg-amber-50 px-4 py-2 text-xs text-amber-800">
								⚠️ {run.fridgeWarning}
							</div>
						{/if}
						{#each run.byCategory as cat (cat.category)}
							<div class="border-b border-gray-50 px-4 py-3 last:border-b-0">
								<div class="text-xs font-semibold text-gray-500 uppercase">
									{STORE_LABELS[cat.category]}
								</div>
								<ul class="mt-1.5 space-y-1">
									{#each cat.items as item (item.name)}
										{@const key = `${run.id}|${item.name}`}
										<li class="flex items-center gap-2 rounded-lg px-1 py-0.5 text-sm hover:bg-gray-50">
											<input
												type="checkbox"
												class="rounded"
												checked={checked.has(key)}
												onchange={() => toggle(key)}
											/>
											<span class={checked.has(key) ? 'text-gray-400 line-through' : 'text-gray-800'}>
												<strong>{item.packs} × {item.packLabel}</strong>
												{item.name}
											</span>
											<span class="ml-auto text-xs text-gray-400">
												Bedarf {fmt(item.needed, item.unit)} → {fmt(item.purchased, item.unit)}
												{#if item.overage > 0.15}<span class="text-amber-600"
														>(+{Math.round(item.overage * 100)}%)</span
													>{/if}
											</span>
										</li>
									{/each}
								</ul>
							</div>
						{/each}
					</section>
				{/each}
			</div>

			<div class="mt-6 flex justify-end">
				<a
					href="/dossier"
					class="inline-flex items-center rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
					>Küchendossier drucken →</a
				>
			</div>
		{/if}
	{/if}
</div>
