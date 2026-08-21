/**
 * Menu plan model (Phase 3): assigns recipes to meal slots per day and offers an
 * auto-suggestion that respects the 4-day variety rule. Every automatic choice
 * is a suggestion the user can override in the UI.
 */

import type { ParsedProgram } from '../parser/types';
import { recipeById, recipesForSlot } from '../recipes/registry';
import type { Recipe } from '../recipes/types';
import { VARIETY_WINDOW_DAYS } from '../rules/checks';
import { recipeIsHeavy, sortRecipesSmart, type CampType, type Season } from './diet';
import type { MealSlot } from '../rules/types';

/** Meals every day gets. */
export const CORE_SLOTS: readonly MealSlot[] = ['zmorge', 'zmittag', 'znacht'];
/** Meals only on selected days (not every single day). */
export const OPTIONAL_SLOTS: readonly MealSlot[] = ['zvieri', 'dessert', 'snack'];

/** Meal slots shown in the planner, in day order. */
export const MENU_SLOTS: readonly MealSlot[] = [
	'zmorge',
	'zmittag',
	'zvieri',
	'znacht',
	'dessert',
	'snack'
];

export const SLOT_LABELS: Record<MealSlot, string> = {
	zmorge: 'Zmorge',
	zmittag: 'Zmittag',
	zvieri: 'Zvieri',
	znacht: 'Znacht',
	dessert: 'Dessert',
	snack: 'Snack',
	mitternachtssnack: 'Mitternachtssnack'
};

/** One day of the menu: a recipe id (or null) per slot. */
export interface MenuDay {
	date: string | null;
	slots: Record<MealSlot, string | null>;
}

export interface MenuPlan {
	days: MenuDay[];
}

function emptySlots(): Record<MealSlot, string | null> {
	return {
		zmorge: null,
		zmittag: null,
		zvieri: null,
		znacht: null,
		dessert: null,
		snack: null,
		mitternachtssnack: null
	};
}

/** Builds an empty menu plan matching the programme's days. */
export function buildPlan(program: ParsedProgram): MenuPlan {
	return { days: program.days.map((d) => ({ date: d.date, slots: emptySlots() })) };
}

// Recipe lookups come from the registry (built-in + user library).
export { recipeById, recipesForSlot };

/** Options steering the auto-planner (user feedback: it must be specific & smart). */
export interface AutoAssignOptions {
	/** Fraction of the group eating vegetarian/vegan (0..1). */
	vegiShare?: number;
	season?: Season;
	campType?: CampType;
	/** Day indices that get a dessert (default: every other day). */
	dessertDays?: Set<number>;
	/** Day indices that get an afternoon snack (default: none). */
	zvieriDays?: Set<number>;
	/** Drop candidates the kitchen can't make (e.g. oven dishes without an oven). */
	exclude?: (recipe: Recipe) => boolean;
}

/**
 * Fills empty slots with a suggestion, rotating through the available recipes
 * and avoiding the same dish within the {@link VARIETY_WINDOW_DAYS}-day window.
 * Existing (user-set) assignments are kept.
 *
 * Core meals (Zmorge/Zmittag/Znacht) are planned every day; Zvieri and Dessert
 * only on the days the caller marks — no dessert or afternoon snack on every
 * single day. Ordering is diet-, season- and camp-type-aware.
 */
export function autoAssign(plan: MenuPlan, opts: AutoAssignOptions = {}): MenuPlan {
	const days = plan.days.map((d) => ({ date: d.date, slots: { ...d.slots } }));
	const dessertDays = opts.dessertDays ?? new Set(days.map((_, i) => i).filter((i) => i % 2 === 0));
	const zvieriDays = opts.zvieriDays ?? new Set<number>();

	const wants = (slot: MealSlot, day: number): boolean => {
		if ((CORE_SLOTS as readonly MealSlot[]).includes(slot)) return true;
		if (slot === 'dessert') return dessertDays.has(day);
		if (slot === 'zvieri') return zvieriDays.has(day);
		return false; // snack stays manual
	};

	// Heavy mains shouldn't land on back-to-back days (user feedback: "zu lastig").
	const heavyMain = (slot: MealSlot, day: number): boolean => {
		if (day < 0 || (slot !== 'zmittag' && slot !== 'znacht')) return false;
		const id = days[day]?.slots[slot];
		const r = id ? recipeById(id) : undefined;
		return r ? recipeIsHeavy(r) : false;
	};

	const slotsToFill: MealSlot[] = ['zmorge', 'zmittag', 'znacht', 'zvieri', 'dessert'];
	for (const slot of slotsToFill) {
		let options = sortRecipesSmart(recipesForSlot(slot), {
			share: opts.vegiShare ?? 0,
			season: opts.season,
			campType: opts.campType
		});
		if (opts.exclude) {
			const filtered = options.filter((r) => !opts.exclude!(r));
			if (filtered.length > 0) options = filtered; // never empty the slot entirely
		}
		if (options.length === 0) continue;
		let cursor = 0;
		for (let i = 0; i < days.length; i++) {
			if (days[i].slots[slot]) continue; // keep user choice
			if (!wants(slot, i)) continue; // this day doesn't get this optional meal
			const recent = new Set(
				days
					.slice(Math.max(0, i - VARIETY_WINDOW_DAYS + 1), i)
					.map((d) => d.slots[slot])
					.filter((x): x is string => x !== null)
			);
			const avoidHeavy = heavyMain(slot, i - 1);
			let chosen = options[cursor % options.length];
			// Two passes: first honour the heavy-day-after guard, then relax it so a
			// dish is always chosen even if every remaining option is heavy.
			for (const strict of [true, false]) {
				let picked = false;
				for (let k = 0; k < options.length; k++) {
					const cand = options[(cursor + k) % options.length];
					if (recent.has(cand.id)) {
						if (k === options.length - 1) cursor += 1;
						continue;
					}
					if (strict && avoidHeavy && recipeIsHeavy(cand)) {
						if (k === options.length - 1) cursor += 1;
						continue;
					}
					chosen = cand;
					cursor += k + 1;
					picked = true;
					break;
				}
				if (picked) break;
			}
			days[i].slots[slot] = chosen.id;
		}
	}
	return { days };
}
