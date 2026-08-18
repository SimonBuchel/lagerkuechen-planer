import { describe, expect, it } from 'vitest';
import type { MenuPlan } from '../menu/plan';
import type { DietComposition, PersonGroup } from '../quantities/types';
import { buildShoppingList, type ShoppingContext } from './aggregate';
import { categorizeIngredient } from './categorize';
import { packageFor } from './packaging';

describe('categorizeIngredient', () => {
	it('sorts ingredients into store categories', () => {
		expect(categorizeIngredient('Hackfleisch')).toBe('fleisch');
		expect(categorizeIngredient('Reibkäse')).toBe('kuehlung');
		expect(categorizeIngredient('Saisongemüse')).toBe('fruechte-gemuese');
		expect(categorizeIngredient('Brot')).toBe('brot');
		expect(categorizeIngredient('Glace')).toBe('tiefkuehl');
		expect(categorizeIngredient('Spaghetti')).toBe('trocken');
	});
});

describe('packageFor', () => {
	it('returns normal and Großverbraucher packs', () => {
		expect(packageFor('Spaghetti', 'g')).toMatchObject({ amount: 500 });
		expect(packageFor('Spaghetti', 'g', true)).toMatchObject({ amount: 5000 });
	});

	it('packs eggs by the carton', () => {
		expect(packageFor('Eier', 'stk')).toMatchObject({ amount: 10 });
	});

	it('falls back to a 1 kg package for unknown items', () => {
		expect(packageFor('Zauberpulver', 'g')).toMatchObject({ amount: 1000 });
	});
});

const groups: PersonGroup[] = [{ role: 'teilnehmende', ageBand: '11-14', count: 30 }];
const noDiet: DietComposition = {
	vegetarisch: 0,
	vegan: 0,
	halal: 0,
	koscher: 0,
	laktosefrei: 0,
	glutenfrei: 0
};

function planWithLunch(recipeId: string, days: number): MenuPlan {
	return {
		days: Array.from({ length: days }, () => ({
			date: null,
			slots: {
				zmorge: null,
				zmittag: recipeId,
				zvieri: null,
				znacht: null,
				dessert: null,
				snack: null,
				mitternachtssnack: null
			}
		}))
	};
}

describe('buildShoppingList', () => {
	const ctx: ShoppingContext = {
		groups,
		diet: noDiet,
		activity: 'normal',
		equipment: { gasbrenner: 4, kesselLiter: [50], backofen: true, kuehlkapazitaetLiter: 200 }
	};
	const list = buildShoppingList(planWithLunch('spaghetti-bolognese', 4), ctx);

	it('puts storable staples in the pre-camp run', () => {
		const vor = list.runs.find((r) => r.id === 'vor');
		expect(vor?.label).toContain('vor dem Lager');
		const trocken = vor?.byCategory.find((c) => c.category === 'trocken');
		expect(trocken?.items.some((i) => i.name === 'Spaghetti')).toBe(true);
	});

	it('schedules fresh meat into fresh runs', () => {
		const freshRuns = list.runs.filter((r) => r.id.startsWith('frisch'));
		expect(freshRuns.length).toBeGreaterThan(0);
		const hasMeat = freshRuns.some((r) =>
			r.byCategory.some(
				(c) => c.category === 'fleisch' && c.items.some((i) => i.name === 'Hackfleisch')
			)
		);
		expect(hasMeat).toBe(true);
	});

	it('rounds up to whole packages with visible overage', () => {
		const vor = list.runs.find((r) => r.id === 'vor')!;
		const pasta = vor.byCategory.flatMap((c) => c.items).find((i) => i.name === 'Spaghetti')!;
		expect(pasta.packs).toBeGreaterThanOrEqual(1);
		expect(pasta.purchased).toBeGreaterThanOrEqual(pasta.needed);
		expect(pasta.overage).toBeGreaterThanOrEqual(0);
	});

	it('warns when a fresh run exceeds the fridge capacity', () => {
		const tight: ShoppingContext = {
			...ctx,
			equipment: { ...ctx.equipment, kuehlkapazitaetLiter: 1 }
		};
		const l = buildShoppingList(planWithLunch('spaghetti-bolognese', 4), tight);
		expect(l.runs.some((r) => r.fridgeWarning)).toBe(true);
	});
});
