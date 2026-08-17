/**
 * Recipe data model (Phase 2).
 *
 * A recipe carries per-person ingredient amounts, ingredient-level allergen
 * tags (Definition of Done: every recipe fully tagged), the kitchen it needs,
 * and short **original** preparation steps. Preparation prose is written from
 * scratch — never copied from cookbooks or websites (Kapitel 8); ingredient
 * lists are free.
 */

import type { Allergen } from '../allergens/types';
import type { IngredientDietClass, KesselClass, Perishability } from '../quantities/types';

export type MealSlot = 'zmorge' | 'zmittag' | 'zvieri' | 'znacht' | 'dessert' | 'snack';

export interface RecipeIngredient {
	name: string;
	/** Reference into BASE_QUANTITIES, or set {@link amountPerPerson} instead. */
	baseKey?: string;
	/** Explicit per-person amount when there is no base-quantity key. */
	amountPerPerson?: number;
	unit: 'g' | 'ml' | 'stk';
	dietClass: IngredientDietClass;
	/** Ingredient-level allergen tags (empty array if none). */
	allergens: Allergen[];
	perishability: Perishability;
	/** Seasoning class, so the kettle correction can damp it at scale. */
	kesselClass?: KesselClass;
}

export interface RecipeCooking {
	/** Cooking stations occupied at the same time. */
	kochstellen: number;
	brauchtOfen: boolean;
	/** Fixed preparation setup in minutes. */
	ruestBasisMin: number;
	/** Additional preparation minutes per portion. */
	ruestProPortionMin: number;
	/** Cooked volume per portion in ml, for kettle sizing (soups, pasta water). */
	volumenProPortionMl?: number;
}

export interface Recipe {
	id: string;
	name: string;
	slot: MealSlot;
	ingredients: RecipeIngredient[];
	/** Short, original preparation steps. */
	steps: string[];
	cooking: RecipeCooking;
	/** True when a vegetarian/vegan variant is readily available. */
	vegiVariante?: boolean;
	tags?: string[];
}
