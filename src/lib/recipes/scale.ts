/**
 * Scales a recipe to camp size, tying together the quantity formula, the diet
 * factor, the kettle correction and the allergen union.
 */

import type { Allergen } from '../allergens/types';
import { baseQuantity } from '../quantities/data';
import {
	requiredKettleLiters,
	ruestPersonenminuten,
	seasoningCorrection
} from '../quantities/kessel';
import {
	dietFactor,
	effectivePersons,
	scaleQuantity,
	shrinkageReserve,
	totalHeadcount
} from '../quantities/scale';
import type { CookingRequirement, ScalingContext } from '../quantities/types';
import type { Recipe } from './types';

/** Household base size a recipe scale factor is measured against (Kapitel 5.2). */
export const HOUSEHOLD_BASE = 4;

export interface ScaledIngredient {
	name: string;
	/** Rounded total amount for the whole camp. */
	amount: number;
	unit: 'g' | 'ml' | 'stk';
	allergens: Allergen[];
}

export interface ScaledRecipe {
	id: string;
	name: string;
	slot: Recipe['slot'];
	/** Effective portions used for scaling (weighted by age/role/activity). */
	effectivePersons: number;
	/** Batch factor vs. a 4-person household recipe, driving the kettle correction. */
	scaleFactor: number;
	ingredients: ScaledIngredient[];
	cooking: CookingRequirement;
	/** Union of all ingredient allergens in the dish. */
	allergens: Allergen[];
}

/** Scales one recipe for the given camp context. */
export function scaleRecipe(recipe: Recipe, ctx: ScalingContext): ScaledRecipe {
	const people = effectivePersons(ctx.groups, ctx.activity);
	const heads = totalHeadcount(ctx.groups);
	const scaleFactor = people / HOUSEHOLD_BASE;

	const ingredients: ScaledIngredient[] = recipe.ingredients.map((ing) => {
		const basePerPerson = resolveBase(ing);
		const df = dietFactor(ing.dietClass, ctx.diet, heads);
		const shrink = shrinkageReserve(ing.perishability, ctx.isFirstDay);
		let amount = scaleQuantity(basePerPerson, people, df, shrink);
		if (ing.kesselClass) amount *= seasoningCorrection(ing.kesselClass, scaleFactor);
		return {
			name: ing.name,
			amount: roundAmount(amount, ing.unit),
			unit: ing.unit,
			allergens: ing.allergens
		};
	});

	const volumePerPortion = recipe.cooking.volumenProPortionMl ?? 0;
	const cooking: CookingRequirement = {
		kesselLiter: requiredKettleLiters(volumePerPortion * heads),
		kochstellen: recipe.cooking.kochstellen,
		brauchtOfen: recipe.cooking.brauchtOfen,
		ruestPersonenminuten: ruestPersonenminuten(
			recipe.cooking.ruestBasisMin,
			recipe.cooking.ruestProPortionMin,
			heads
		)
	};

	const allergens = [...new Set(recipe.ingredients.flatMap((i) => i.allergens))];

	return {
		id: recipe.id,
		name: recipe.name,
		slot: recipe.slot,
		effectivePersons: round1(people),
		scaleFactor: round1(scaleFactor),
		ingredients,
		cooking,
		allergens
	};
}

function resolveBase(ing: Recipe['ingredients'][number]): number {
	if (ing.baseKey) {
		const base = baseQuantity(ing.baseKey);
		if (base) return base.amount;
	}
	return ing.amountPerPerson ?? 0;
}

/** Grams/millilitres round to the nearest 10; pieces to one decimal. */
function roundAmount(amount: number, unit: 'g' | 'ml' | 'stk'): number {
	if (unit === 'stk') return Math.round(amount * 10) / 10;
	return Math.round(amount / 10) * 10;
}

function round1(x: number): number {
	return Math.round(x * 10) / 10;
}
