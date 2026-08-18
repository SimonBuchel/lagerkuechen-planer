import { describe, expect, it } from 'vitest';
import { blankRecipe, exportRecipes, importRecipes, validateCustomRecipe } from './library';
import { allRecipes, recipeById, recipesForSlot, setCustomRecipes } from './registry';
import type { Recipe } from './types';

const valid: Recipe = {
	id: 'mein-znacht',
	name: 'Mein Znacht',
	slot: 'znacht',
	ingredients: [
		{
			name: 'Brot',
			baseKey: 'brot-znacht',
			unit: 'g',
			dietClass: 'neutral',
			allergens: ['gluten'],
			perishability: 'frisch_1_tag'
		}
	],
	steps: ['Brot schneiden.'],
	cooking: { kochstellen: 0, brauchtOfen: false, ruestBasisMin: 10, ruestProPortionMin: 0.2 }
};

describe('validateCustomRecipe', () => {
	it('accepts a well-formed recipe', () => {
		expect(validateCustomRecipe(valid)).toEqual([]);
	});

	it('flags a bad id, missing ingredient resolution and unknown allergen', () => {
		const bad: Recipe = {
			...valid,
			id: 'Bad Id!',
			ingredients: [
				{
					name: 'X',
					unit: 'g',
					dietClass: 'neutral',
					allergens: ['xxx' as never],
					perishability: 'lagerfaehig'
				}
			]
		};
		const errs = validateCustomRecipe(bad);
		expect(errs.some((e) => e.includes('id'))).toBe(true);
		expect(errs.some((e) => e.includes('amountPerPerson'))).toBe(true);
		expect(errs.some((e) => e.includes('Allergen'))).toBe(true);
	});

	it('blankRecipe fails validation until filled in', () => {
		expect(validateCustomRecipe(blankRecipe()).length).toBeGreaterThan(0);
	});
});

describe('import/export round-trip', () => {
	it('imports what it exported', () => {
		const json = exportRecipes([valid]);
		const result = importRecipes(json);
		expect(result.errors).toEqual([]);
		expect(result.recipes[0].id).toBe('mein-znacht');
	});

	it('collects errors and drops invalid recipes', () => {
		const json = JSON.stringify([
			valid,
			{ id: 'x', name: '', slot: 'znacht', ingredients: [], steps: [], cooking: {} }
		]);
		const result = importRecipes(json);
		expect(result.recipes).toHaveLength(1);
		expect(result.errors.length).toBeGreaterThan(0);
	});

	it('rejects non-array JSON', () => {
		expect(importRecipes('{}').errors.length).toBeGreaterThan(0);
	});
});

describe('registry merge', () => {
	it('adds custom recipes to lookups and clears them again', () => {
		setCustomRecipes([valid]);
		expect(recipeById('mein-znacht')?.name).toBe('Mein Znacht');
		expect(recipesForSlot('znacht').some((r) => r.id === 'mein-znacht')).toBe(true);
		expect(allRecipes().length).toBeGreaterThan(60);
		setCustomRecipes([]);
		expect(recipeById('mein-znacht')).toBeUndefined();
	});

	it('still finds built-in recipes', () => {
		expect(recipeById('spaghetti-bolognese')?.name).toBe('Spaghetti Bolognese');
	});
});
