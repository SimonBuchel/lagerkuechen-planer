<script lang="ts">
	import { RECIPES } from '$lib/recipes/data';
	import {
		blankRecipe,
		exportRecipes,
		importRecipes,
		validateCustomRecipe
	} from '$lib/recipes/library';
	import { getCustomRecipes } from '$lib/recipes/registry';
	import { loadCustomRecipes, saveCustomRecipes } from '$lib/recipes/storage';
	import { SLOT_LABELS } from '$lib/menu/plan';
	import { ALLERGENS } from '$lib/allergens/data';
	import type { MealSlot, Recipe } from '$lib/recipes/types';

	const SLOTS: MealSlot[] = ['zmorge', 'zmittag', 'zvieri', 'znacht', 'dessert', 'snack'];
	const UNITS = ['g', 'ml', 'stk'] as const;
	const DIET = ['neutral', 'meat', 'fish', 'animalProduct', 'meatAlternative'] as const;
	const PERISH = ['lagerfaehig', 'frisch_3_tage', 'frisch_1_tag'] as const;

	let custom = $state<Recipe[]>([]);
	let editing = $state<Recipe | null>(null);
	let stepsText = $state('');
	let errors = $state<string[]>([]);
	let importMsg = $state('');

	$effect(() => {
		custom = loadCustomRecipes();
	});

	function startNew() {
		editing = blankRecipe();
		stepsText = '';
		errors = [];
	}
	function editRecipe(r: Recipe) {
		editing = structuredClone($state.snapshot(r)) as Recipe;
		stepsText = editing.steps.join('\n');
		errors = [];
	}
	function duplicate(r: Recipe) {
		const copy = structuredClone(r) as Recipe;
		copy.id = `${r.id}-kopie`;
		copy.name = `${r.name} (Kopie)`;
		editing = copy;
		stepsText = copy.steps.join('\n');
		errors = [];
	}
	function addIngredient() {
		editing?.ingredients.push({
			name: '',
			amountPerPerson: 100,
			unit: 'g',
			dietClass: 'neutral',
			allergens: [],
			perishability: 'lagerfaehig'
		});
	}
	function removeIngredient(i: number) {
		editing?.ingredients.splice(i, 1);
	}

	function save() {
		if (!editing) return;
		editing.steps = stepsText
			.split('\n')
			.map((s) => s.trim())
			.filter(Boolean);
		const errs = validateCustomRecipe(editing);
		if (errs.length) {
			errors = errs;
			return;
		}
		const next = custom.filter((r) => r.id !== editing!.id);
		next.push(editing);
		custom = next;
		saveCustomRecipes(next);
		editing = null;
		errors = [];
	}
	function removeCustom(id: string) {
		custom = custom.filter((r) => r.id !== id);
		saveCustomRecipes(custom);
		if (editing?.id === id) editing = null;
	}

	function download() {
		const blob = new Blob([exportRecipes(custom)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'meine-rezepte.json';
		a.click();
		URL.revokeObjectURL(url);
	}
	async function onImport(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		const text = await file.text();
		const { recipes, errors: errs } = importRecipes(text);
		const byId = new Map(custom.map((r) => [r.id, r]));
		for (const r of recipes) byId.set(r.id, r);
		custom = [...byId.values()];
		saveCustomRecipes(custom);
		importMsg = `${recipes.length} importiert${errs.length ? `, ${errs.length} fehlerhaft` : ''}.`;
	}

	const builtinBySlot = $derived(
		SLOTS.map((s) => ({ slot: s, recipes: RECIPES.filter((r) => r.slot === s) }))
	);
</script>

<svelte:head><title>Rezepte – Lagerküchen-Planer</title></svelte:head>

<div class="mx-auto max-w-5xl px-4 py-8">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<h1 class="text-2xl font-bold text-gray-900">Rezept-Bibliothek</h1>
		<div class="flex gap-2">
			<button
				class="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
				onclick={startNew}>+ Eigenes Rezept</button
			>
			<button
				class="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium hover:bg-gray-200"
				onclick={download}>Export</button
			>
			<label
				class="cursor-pointer rounded-md bg-gray-100 px-3 py-2 text-sm font-medium hover:bg-gray-200"
			>
				Import<input type="file" accept="application/json" class="hidden" onchange={onImport} />
			</label>
		</div>
	</div>
	{#if importMsg}<p class="mt-2 text-sm text-emerald-700">{importMsg}</p>{/if}

	<!-- Editor -->
	{#if editing}
		<section class="mt-6 rounded-lg border border-sky-200 bg-sky-50/40 p-4">
			<h2 class="font-semibold text-gray-900">Rezept bearbeiten</h2>
			<div class="mt-3 grid gap-2 sm:grid-cols-3">
				<label class="text-sm"
					>id (a–z, 0–9, -)<input
						class="mt-0.5 w-full rounded border-gray-300 text-sm"
						bind:value={editing.id}
					/></label
				>
				<label class="text-sm"
					>Name<input
						class="mt-0.5 w-full rounded border-gray-300 text-sm"
						bind:value={editing.name}
					/></label
				>
				<label class="text-sm"
					>Mahlzeit
					<select class="mt-0.5 w-full rounded border-gray-300 text-sm" bind:value={editing.slot}>
						{#each SLOTS as s (s)}<option value={s}>{SLOT_LABELS[s]}</option>{/each}
					</select>
				</label>
			</div>

			<h3 class="mt-4 text-sm font-semibold text-gray-700">Zutaten</h3>
			<div class="mt-1 space-y-2">
				{#each editing.ingredients as ing, i (i)}
					<div
						class="grid items-center gap-1 rounded border border-gray-200 bg-white p-2 sm:grid-cols-6"
					>
						<input
							class="rounded border-gray-300 text-sm sm:col-span-2"
							placeholder="Name"
							bind:value={ing.name}
						/>
						<input
							type="number"
							class="rounded border-gray-300 text-sm"
							placeholder="Menge/Person"
							bind:value={ing.amountPerPerson}
						/>
						<select class="rounded border-gray-300 text-sm" bind:value={ing.unit}
							>{#each UNITS as u (u)}<option value={u}>{u}</option>{/each}</select
						>
						<select class="rounded border-gray-300 text-sm" bind:value={ing.dietClass}
							>{#each DIET as d (d)}<option value={d}>{d}</option>{/each}</select
						>
						<select class="rounded border-gray-300 text-sm" bind:value={ing.perishability}
							>{#each PERISH as p (p)}<option value={p}>{p}</option>{/each}</select
						>
						<select
							multiple
							class="rounded border-gray-300 text-xs sm:col-span-5"
							bind:value={ing.allergens}
						>
							{#each ALLERGENS as a (a.key)}<option value={a.key}>{a.label}</option>{/each}
						</select>
						<button class="text-xs text-red-600 hover:underline" onclick={() => removeIngredient(i)}
							>entfernen</button
						>
					</div>
				{/each}
				<button
					class="rounded bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200"
					onclick={addIngredient}>+ Zutat</button
				>
			</div>

			<label class="mt-4 block text-sm"
				>Zubereitung (ein Schritt pro Zeile)
				<textarea
					rows="3"
					class="mt-0.5 w-full rounded border-gray-300 text-sm"
					bind:value={stepsText}></textarea>
			</label>

			<div class="mt-3 grid gap-2 sm:grid-cols-4">
				<label class="text-sm"
					>Kochstellen<input
						type="number"
						class="mt-0.5 w-full rounded border-gray-300 text-sm"
						bind:value={editing.cooking.kochstellen}
					/></label
				>
				<label class="flex items-center gap-2 text-sm"
					>Backofen<input type="checkbox" bind:checked={editing.cooking.brauchtOfen} /></label
				>
				<label class="text-sm"
					>Rüsten Basis (Min)<input
						type="number"
						class="mt-0.5 w-full rounded border-gray-300 text-sm"
						bind:value={editing.cooking.ruestBasisMin}
					/></label
				>
				<label class="text-sm"
					>Rüsten/Portion (Min)<input
						type="number"
						step="0.1"
						class="mt-0.5 w-full rounded border-gray-300 text-sm"
						bind:value={editing.cooking.ruestProPortionMin}
					/></label
				>
			</div>

			{#if errors.length}
				<ul
					class="mt-3 space-y-0.5 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700"
				>
					{#each errors as e, i (i)}<li>• {e}</li>{/each}
				</ul>
			{/if}

			<div class="mt-4 flex gap-2">
				<button
					class="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
					onclick={save}>Speichern</button
				>
				<button
					class="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium hover:bg-gray-200"
					onclick={() => (editing = null)}>Abbrechen</button
				>
			</div>
		</section>
	{/if}

	<!-- Meine Rezepte -->
	<section class="mt-8">
		<h2 class="font-semibold text-gray-900">Meine Rezepte ({custom.length})</h2>
		{#if custom.length === 0}
			<p class="mt-1 text-sm text-gray-500">
				Noch keine eigenen Rezepte. Lege eines an oder dupliziere eine Vorlage.
			</p>
		{:else}
			<ul class="mt-2 divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
				{#each custom as r (r.id)}
					<li class="flex items-center gap-2 p-3 text-sm">
						<span class="font-medium text-gray-800">{r.name}</span>
						<span class="text-xs text-gray-400"
							>{SLOT_LABELS[r.slot]} · {r.ingredients.length} Zutaten</span
						>
						<span class="ml-auto flex gap-2">
							<button class="text-sky-700 hover:underline" onclick={() => editRecipe(r)}
								>bearbeiten</button
							>
							<button class="text-red-600 hover:underline" onclick={() => removeCustom(r.id)}
								>löschen</button
							>
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<!-- Vorlagen -->
	<section class="mt-8">
		<h2 class="font-semibold text-gray-900">Vorlagen ({RECIPES.length})</h2>
		<p class="mt-1 text-xs text-gray-500">
			Duplizieren, um eine eigene, anpassbare Kopie zu erstellen.
		</p>
		<div class="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each builtinBySlot as group (group.slot)}
				<div class="rounded-lg border border-gray-200 bg-white p-3">
					<div class="text-xs font-semibold text-gray-500 uppercase">{SLOT_LABELS[group.slot]}</div>
					<ul class="mt-1 space-y-0.5 text-sm">
						{#each group.recipes as r (r.id)}
							<li class="flex items-center gap-2">
								<span class="text-gray-700">{r.name}</span>
								<button
									class="ml-auto text-xs text-sky-700 hover:underline"
									onclick={() => duplicate(r)}>duplizieren</button
								>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	</section>
</div>
