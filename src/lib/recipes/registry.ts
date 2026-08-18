/**
 * Recipe registry (Phase 6): the single source of truth for "all recipes",
 * merging the built-in collection with the user's own library that grows over
 * the years. Kept as a plain module (no runes) so the pure engines stay
 * unit-testable; the UI hydrates the custom set from storage at startup.
 */

import { RECIPES } from './data';
import type { Recipe } from './types';
import type { MealSlot } from '../rules/types';

let customRecipes: Recipe[] = [];

/** Replaces the custom recipe set (called by the UI after loading from storage). */
export function setCustomRecipes(recipes: Recipe[]): void {
	customRecipes = recipes;
}

/** The user's own recipes currently registered. */
export function getCustomRecipes(): Recipe[] {
	return customRecipes;
}

/** Built-in recipes followed by the user's own (custom wins on id clash). */
export function allRecipes(): Recipe[] {
	if (customRecipes.length === 0) return [...RECIPES];
	const byId = new Map<string, Recipe>();
	for (const r of RECIPES) byId.set(r.id, r);
	for (const r of customRecipes) byId.set(r.id, r);
	return [...byId.values()];
}

/** Looks up a recipe by id across built-in and custom recipes. */
export function recipeById(id: string | null): Recipe | undefined {
	if (!id) return undefined;
	return customRecipes.find((r) => r.id === id) ?? RECIPES.find((r) => r.id === id);
}

/** All recipes (built-in + custom) available for a given meal slot. */
export function recipesForSlot(slot: MealSlot): Recipe[] {
	return allRecipes().filter((r) => r.slot === slot);
}
