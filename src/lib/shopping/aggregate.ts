/**
 * Builds the shopping list from the menu plan (Kapitel 7.3): aggregate all
 * scaled ingredient amounts, split into shopping runs by shelf life, convert to
 * whole packages with visible rounding, group by store category, and check the
 * fridge capacity for each fresh run.
 */

import type { AllergyProfile } from '../allergens/types';
import { MENU_SLOTS, recipeById, type MenuPlan } from '../menu/plan';
import { scaleRecipe } from '../recipes/scale';
import type {
	ActivityLevel,
	DietComposition,
	KitchenEquipment,
	Perishability,
	PersonGroup
} from '../quantities/types';
import { categorizeIngredient } from './categorize';
import { packageFor } from './packaging';
import {
	STORE_ORDER,
	type ShoppingItem,
	type ShoppingList,
	type ShoppingRun,
	type StoreCategory
} from './types';

export interface ShoppingContext {
	groups: PersonGroup[];
	diet: DietComposition;
	activity: ActivityLevel;
	equipment: KitchenEquipment;
	allergies?: AllergyProfile[];
}

export interface ShoppingOptions {
	grossverbraucher?: boolean;
	/** ISO dates per menu day, for run labels. */
	dates?: (string | null)[];
}

/** How many days a fresh-produce run covers. */
const FRESH_RUN_DAYS = 3;

/** The shopping run an ingredient belongs to, given its shelf life and day. */
function runKeyFor(perishability: Perishability, dayIndex: number): string {
	if (perishability === 'lagerfaehig') return 'vor';
	if (perishability === 'frisch_1_tag') return `frisch-${dayIndex}`;
	return `frisch-${Math.floor(dayIndex / FRESH_RUN_DAYS) * FRESH_RUN_DAYS}`;
}

interface Agg {
	name: string;
	unit: 'g' | 'ml' | 'stk';
	needed: number;
	perishability: Perishability;
}

export function buildShoppingList(
	plan: MenuPlan,
	ctx: ShoppingContext,
	opts: ShoppingOptions = {}
): ShoppingList {
	// runKey -> "name|unit" -> aggregate
	const runs = new Map<string, Map<string, Agg>>();

	plan.days.forEach((day, i) => {
		for (const slot of MENU_SLOTS) {
			const recipe = recipeById(day.slots[slot]);
			if (!recipe) continue;
			const scaled = scaleRecipe(recipe, {
				groups: ctx.groups,
				activity: ctx.activity,
				diet: ctx.diet,
				isFirstDay: i === 0
			});
			for (const ing of scaled.ingredients) {
				if (ing.amount <= 0) continue;
				const runKey = runKeyFor(ing.perishability, i);
				const bucket = runs.get(runKey) ?? new Map<string, Agg>();
				const key = `${ing.name}|${ing.unit}`;
				const existing = bucket.get(key);
				if (existing) existing.needed += ing.amount;
				else
					bucket.set(key, {
						name: ing.name,
						unit: ing.unit,
						needed: ing.amount,
						perishability: ing.perishability
					});
				runs.set(runKey, bucket);
			}
		}
	});

	const result: ShoppingRun[] = [];
	for (const [runKey, bucket] of runs) {
		const items: ShoppingItem[] = [...bucket.values()].map((agg) =>
			toShoppingItem(agg, opts.grossverbraucher ?? false)
		);
		const byCategory = groupByCategory(items);
		const fridgeLiters = runKey === 'vor' ? 0 : estimateFridgeLiters(items);
		const run: ShoppingRun = {
			id: runKey,
			label: labelForRun(runKey, opts.dates),
			date: dateForRun(runKey, opts.dates),
			byCategory,
			fridgeLiters
		};
		if (fridgeLiters > ctx.equipment.kuehlkapazitaetLiter) {
			run.fridgeWarning = `Frischware ~${Math.round(fridgeLiters)} l übersteigt die Kühlkapazität von ${ctx.equipment.kuehlkapazitaetLiter} l.`;
		}
		result.push(run);
	}

	result.sort((a, b) => runOrder(a.id) - runOrder(b.id));
	return { runs: result };
}

function toShoppingItem(agg: Agg, grossverbraucher: boolean): ShoppingItem {
	const pkg = packageFor(agg.name, agg.unit, grossverbraucher);
	const packs = Math.max(1, Math.ceil(agg.needed / pkg.amount));
	const purchased = packs * pkg.amount;
	return {
		name: agg.name,
		category: categorizeIngredient(agg.name),
		unit: agg.unit,
		needed: agg.needed,
		packs,
		packLabel: pkg.label,
		purchased,
		overage: agg.needed > 0 ? purchased / agg.needed - 1 : 0
	};
}

function groupByCategory(items: ShoppingItem[]): ShoppingRun['byCategory'] {
	const map = new Map<StoreCategory, ShoppingItem[]>();
	for (const item of items) {
		const list = map.get(item.category) ?? [];
		list.push(item);
		map.set(item.category, list);
	}
	return STORE_ORDER.filter((c) => map.has(c)).map((category) => ({
		category,
		items: (map.get(category) ?? []).sort((a, b) => a.name.localeCompare(b.name))
	}));
}

/** Rough fresh volume in litres (1000 g/ml ≈ 1 l; pieces ignored). */
function estimateFridgeLiters(items: ShoppingItem[]): number {
	let ml = 0;
	for (const item of items) {
		if (item.unit === 'g' || item.unit === 'ml') ml += item.purchased;
	}
	return ml / 1000;
}

function runOrder(runKey: string): number {
	if (runKey === 'vor') return -1;
	return Number(runKey.replace('frisch-', ''));
}

function labelForRun(runKey: string, dates?: (string | null)[]): string {
	if (runKey === 'vor') return 'Grosseinkauf vor dem Lager';
	const day = Number(runKey.replace('frisch-', ''));
	const date = dates?.[day];
	return `Frischeinkauf – Tag ${day + 1}${date ? ` (${date})` : ''}`;
}

function dateForRun(runKey: string, dates?: (string | null)[]): string | null {
	if (runKey === 'vor') return null;
	const day = Number(runKey.replace('frisch-', ''));
	return dates?.[day] ?? null;
}
