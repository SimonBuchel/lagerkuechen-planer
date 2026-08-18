/**
 * Recipe library helpers (Phase 6): validation and JSON import/export for the
 * user's own recipes. Pure functions so they can be unit-tested and reused by
 * the UI and any future import path.
 */

import { ALLERGEN_KEYS } from '../allergens/data';
import { baseQuantity } from '../quantities/data';
import type { MealSlot, Recipe, RecipeIngredient } from './types';

const SLOTS: MealSlot[] = ['zmorge', 'zmittag', 'zvieri', 'znacht', 'dessert', 'snack'];
const UNITS = ['g', 'ml', 'stk'];
const DIET_CLASSES = ['neutral', 'meat', 'fish', 'animalProduct', 'meatAlternative'];
const PERISHABILITIES = ['lagerfaehig', 'frisch_3_tage', 'frisch_1_tag'];

/** Validates a single ingredient, returning error messages (empty = valid). */
function validateIngredient(ing: RecipeIngredient, i: number): string[] {
	const e: string[] = [];
	const at = `Zutat ${i + 1}`;
	if (!ing.name?.trim()) e.push(`${at}: Name fehlt.`);
	if (!UNITS.includes(ing.unit)) e.push(`${at}: ungültige Einheit.`);
	if (!DIET_CLASSES.includes(ing.dietClass)) e.push(`${at}: ungültige Diät-Klasse.`);
	if (!PERISHABILITIES.includes(ing.perishability)) e.push(`${at}: ungültige Haltbarkeit.`);
	const resolvable = (ing.baseKey && baseQuantity(ing.baseKey)) || ing.amountPerPerson != null;
	if (!resolvable) e.push(`${at}: weder gültiger baseKey noch amountPerPerson.`);
	for (const a of ing.allergens ?? []) {
		if (!ALLERGEN_KEYS.has(a)) e.push(`${at}: unbekanntes Allergen "${a}".`);
	}
	return e;
}

/** Validates a custom recipe; returns all error messages (empty array = valid). */
export function validateCustomRecipe(recipe: Recipe): string[] {
	const e: string[] = [];
	if (!recipe.id?.trim()) e.push('id fehlt.');
	else if (!/^[a-z0-9-]+$/.test(recipe.id)) e.push('id darf nur a–z, 0–9, - enthalten.');
	if (!recipe.name?.trim()) e.push('Name fehlt.');
	if (!SLOTS.includes(recipe.slot)) e.push('ungültiger Mahlzeiten-Slot.');
	if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
		e.push('mindestens eine Zutat nötig.');
	} else {
		recipe.ingredients.forEach((ing, i) => e.push(...validateIngredient(ing, i)));
	}
	if (!Array.isArray(recipe.steps) || recipe.steps.length === 0)
		e.push('mindestens ein Schritt nötig.');
	if (!recipe.cooking) e.push('Kochangaben (cooking) fehlen.');
	return e;
}

/** Serializes custom recipes to a pretty JSON string for export. */
export function exportRecipes(recipes: Recipe[]): string {
	return JSON.stringify(recipes, null, 2);
}

export interface ImportResult {
	recipes: Recipe[];
	errors: string[];
}

/**
 * Parses and validates a JSON export. Invalid recipes are collected in
 * `errors`; only valid ones are returned in `recipes`.
 */
export function importRecipes(json: string): ImportResult {
	let parsed: unknown;
	try {
		parsed = JSON.parse(json);
	} catch {
		return { recipes: [], errors: ['Ungültiges JSON.'] };
	}
	if (!Array.isArray(parsed))
		return { recipes: [], errors: ['Erwartet wird eine Liste von Rezepten.'] };

	const recipes: Recipe[] = [];
	const errors: string[] = [];
	parsed.forEach((r, i) => {
		const recipe = r as Recipe;
		const errs = validateCustomRecipe(recipe);
		if (errs.length) errors.push(`Rezept ${i + 1} (${recipe?.name ?? '?'}): ${errs.join(' ')}`);
		else recipes.push(recipe);
	});
	return { recipes, errors };
}

/** A blank custom recipe to start editing from. */
export function blankRecipe(): Recipe {
	return {
		id: '',
		name: '',
		slot: 'zmittag',
		ingredients: [
			{
				name: '',
				amountPerPerson: 100,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig'
			}
		],
		steps: [''],
		cooking: { kochstellen: 1, brauchtOfen: false, ruestBasisMin: 15, ruestProPortionMin: 0.4 }
	};
}
