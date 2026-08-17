import { describe, expect, it } from 'vitest';
import type { DietComposition, PersonGroup } from '../quantities/types';
import { RECIPES } from './data';
import { scaleRecipe } from './scale';
import type { Recipe } from './types';

const groups: PersonGroup[] = [
	{ role: 'teilnehmende', ageBand: '11-14', count: 36 }, // 32.4
	{ role: 'leitende', ageBand: '18+', count: 6 }, // 6.9
	{ role: 'kuechenteam', ageBand: '18+', count: 2 } // 2.4
];
const noDiet: DietComposition = {
	vegetarisch: 0,
	vegan: 0,
	halal: 0,
	koscher: 0,
	laktosefrei: 0,
	glutenfrei: 0
};

const spaghetti = RECIPES.find((r) => r.id === 'spaghetti-bolognese') as Recipe;

describe('scaleRecipe', () => {
	it('reports effective persons and the batch factor', () => {
		const scaled = scaleRecipe(spaghetti, { groups, activity: 'normal', diet: noDiet });
		expect(scaled.effectivePersons).toBeCloseTo(41.7, 1);
		expect(scaled.scaleFactor).toBeCloseTo(10.4, 1);
	});

	it('scales a storable staple with the standard 5 % reserve', () => {
		const scaled = scaleRecipe(spaghetti, { groups, activity: 'normal', diet: noDiet });
		const pasta = scaled.ingredients.find((i) => i.name === 'Spaghetti')!;
		// 110 * 41.7 * 1 * 1.05 = 4816.35 -> round to 10
		expect(pasta.amount).toBe(4820);
	});

	it('scales fresh meat with the 10 % reserve', () => {
		const scaled = scaleRecipe(spaghetti, { groups, activity: 'normal', diet: noDiet });
		const meat = scaled.ingredients.find((i) => i.name === 'Hackfleisch')!;
		// 130 * 41.7 * 1 * 1.10 = 5963.1 -> 5960
		expect(meat.amount).toBe(5960);
	});

	it('damps seasoning at large batch (factor >= 4)', () => {
		const scaled = scaleRecipe(spaghetti, { groups, activity: 'normal', diet: noDiet });
		const salt = scaled.ingredients.find((i) => i.name === 'Salz')!;
		// 2 * 41.7 * 1 * 1.05 * 0.8 = 70.06 -> 70
		expect(salt.amount).toBe(70);
	});

	it('splits meat and its substitute by the diet mix', () => {
		const diet: DietComposition = { ...noDiet, vegetarisch: 4 };
		const scaled = scaleRecipe(spaghetti, { groups, activity: 'normal', diet });
		const meat = scaled.ingredients.find((i) => i.name === 'Hackfleisch')!;
		const soy = scaled.ingredients.find((i) => i.name === 'Sojagranulat (vegi)')!;
		// meat now serves 40/44 of people, the substitute serves 4/44
		expect(meat.amount).toBeLessThan(5960);
		expect(soy.amount).toBeGreaterThan(0);
	});

	it('unions the ingredient allergens of the dish', () => {
		const scaled = scaleRecipe(spaghetti, { groups, activity: 'normal', diet: noDiet });
		expect(scaled.allergens).toContain('gluten');
		expect(scaled.allergens).toContain('milch');
		expect(scaled.allergens).toContain('soja');
	});

	it('derives a kettle size that grows with the group', () => {
		const scaled = scaleRecipe(spaghetti, { groups, activity: 'normal', diet: noDiet });
		// 550 ml/portion * 44 heads / 1000 / 0.8 fill ratio
		expect(scaled.cooking.kesselLiter).toBeGreaterThan(24);
	});
});
