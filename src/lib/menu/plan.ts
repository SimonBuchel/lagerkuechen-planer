/**
 * Menu plan model (Phase 3): assigns recipes to meal slots per day and offers an
 * auto-suggestion that respects the 4-day variety rule. Every automatic choice
 * is a suggestion the user can override in the UI.
 */

import type { ParsedProgram } from '../parser/types';
import { recipeById, recipesForSlot } from '../recipes/registry';
import type { Recipe } from '../recipes/types';
import { VARIETY_WINDOW_DAYS } from '../rules/checks';
import type { MealSlot } from '../rules/types';

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

/**
 * Fills empty slots with a suggestion, rotating through the available recipes
 * and avoiding the same dish within the {@link VARIETY_WINDOW_DAYS}-day window.
 * Existing (user-set) assignments are kept.
 */
export function autoAssign(plan: MenuPlan): MenuPlan {
	const slotsToFill: MealSlot[] = ['zmorge', 'zmittag', 'znacht', 'zvieri', 'dessert'];
	const days = plan.days.map((d) => ({ date: d.date, slots: { ...d.slots } }));

	for (const slot of slotsToFill) {
		const options = recipesForSlot(slot);
		if (options.length === 0) continue;
		let cursor = 0;
		for (let i = 0; i < days.length; i++) {
			if (days[i].slots[slot]) continue; // keep user choice
			const recent = new Set(
				days
					.slice(Math.max(0, i - VARIETY_WINDOW_DAYS + 1), i)
					.map((d) => d.slots[slot])
					.filter((x): x is string => x !== null)
			);
			// Pick the next option not used recently; fall back to plain rotation.
			let chosen = options[cursor % options.length];
			for (let k = 0; k < options.length; k++) {
				const cand = options[(cursor + k) % options.length];
				if (!recent.has(cand.id)) {
					chosen = cand;
					cursor += k + 1;
					break;
				}
				if (k === options.length - 1) cursor += 1;
			}
			days[i].slots[slot] = chosen.id;
		}
	}
	return { days };
}
