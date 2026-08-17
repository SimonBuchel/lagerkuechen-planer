import { describe, expect, it } from 'vitest';
import { ALLERGEN_KEYS } from '../allergens/data';
import { baseQuantity } from '../quantities/data';
import { RECIPES } from './data';

describe('recipe collection', () => {
	it('has at least 60 recipes (Definition of Done, Kapitel 11)', () => {
		expect(RECIPES.length).toBeGreaterThanOrEqual(60);
	});

	it('has unique ids', () => {
		const ids = RECIPES.map((r) => r.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('every ingredient resolves to a quantity', () => {
		for (const recipe of RECIPES) {
			for (const ing of recipe.ingredients) {
				const resolvable =
					(ing.baseKey && baseQuantity(ing.baseKey)) || ing.amountPerPerson != null;
				expect(resolvable, `${recipe.id} / ${ing.name}`).toBeTruthy();
			}
		}
	});

	it('every allergen tag is from the controlled list (Kapitel 8)', () => {
		for (const recipe of RECIPES) {
			for (const ing of recipe.ingredients) {
				for (const a of ing.allergens) {
					expect(ALLERGEN_KEYS.has(a), `${recipe.id} / ${ing.name}: ${a}`).toBe(true);
				}
			}
		}
	});

	it('every recipe has at least one preparation step', () => {
		for (const recipe of RECIPES) {
			expect(recipe.steps.length, recipe.id).toBeGreaterThan(0);
		}
	});
});
