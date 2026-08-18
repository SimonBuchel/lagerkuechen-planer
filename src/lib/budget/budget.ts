/**
 * Budget calculation (Kapitel 7.4): planned cost per meal and day from the menu
 * plan and the price estimates, compared against a CHF-per-person-per-day
 * target. Pure functions; prices are estimates the user can override.
 */

import { MENU_SLOTS, recipeById, type MenuPlan } from '../menu/plan';
import { scaleRecipe } from '../recipes/scale';
import { totalHeadcount } from '../quantities/scale';
import type { ActivityLevel, DietComposition, PersonGroup } from '../quantities/types';
import type { MealSlot } from '../rules/types';
import { priceFor } from './prices';

export interface BudgetContext {
	groups: PersonGroup[];
	diet: DietComposition;
	activity: ActivityLevel;
	/** Target spend in CHF per person and day. */
	budgetPerPersonDay: number;
	/** Per-ingredient price overrides (CHF per base unit). */
	priceOverrides?: Record<string, number>;
}

export interface MealCost {
	slot: MealSlot;
	recipeId: string;
	recipeName: string;
	cost: number;
}

export interface DayBudget {
	index: number;
	date: string | null;
	meals: MealCost[];
	total: number;
}

export interface BudgetSummary {
	days: DayBudget[];
	plannedTotal: number;
	targetTotal: number;
	personDays: number;
	plannedPerPersonDay: number;
	targetPerPersonDay: number;
}

function round2(x: number): number {
	return Math.round(x * 100) / 100;
}

/** Cost of one scaled recipe from its ingredient amounts and the price table. */
function recipeCost(recipeId: string, ctx: BudgetContext, isFirstDay: boolean): number {
	const recipe = recipeById(recipeId);
	if (!recipe) return 0;
	const scaled = scaleRecipe(recipe, {
		groups: ctx.groups,
		activity: ctx.activity,
		diet: ctx.diet,
		isFirstDay
	});
	let cost = 0;
	for (const ing of scaled.ingredients) {
		cost += ing.amount * priceFor(ing.name, ing.unit, ctx.priceOverrides);
	}
	return cost;
}

/** Computes the full budget summary for a menu plan. */
export function computeBudget(plan: MenuPlan, ctx: BudgetContext): BudgetSummary {
	const heads = totalHeadcount(ctx.groups);
	const personDays = heads * plan.days.length;

	const days: DayBudget[] = plan.days.map((day, i) => {
		const meals: MealCost[] = [];
		for (const slot of MENU_SLOTS) {
			const recipeId = day.slots[slot];
			const recipe = recipeById(recipeId);
			if (!recipe) continue;
			meals.push({
				slot,
				recipeId: recipe.id,
				recipeName: recipe.name,
				cost: round2(recipeCost(recipe.id, ctx, i === 0))
			});
		}
		const total = round2(meals.reduce((s, m) => s + m.cost, 0));
		return { index: i, date: day.date, meals, total };
	});

	const plannedTotal = round2(days.reduce((s, d) => s + d.total, 0));
	const targetTotal = round2(personDays * ctx.budgetPerPersonDay);
	return {
		days,
		plannedTotal,
		targetTotal,
		personDays,
		plannedPerPersonDay: personDays > 0 ? round2(plannedTotal / personDays) : 0,
		targetPerPersonDay: ctx.budgetPerPersonDay
	};
}
