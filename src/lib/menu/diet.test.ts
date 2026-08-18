import { describe, expect, it } from 'vitest';
import { recipeById } from '../recipes/registry';
import type { Recipe } from '../recipes/types';
import {
	mealDietStatus,
	recipeDietProfile,
	recipeIsCold,
	sortRecipesByDiet,
	sortRecipesSmart,
	vegiPortions,
	vegiShare
} from './diet';

const get = (id: string) => recipeById(id) as Recipe;

describe('recipeDietProfile', () => {
	it('classifies dishes by ingredients and veggie variant', () => {
		expect(recipeDietProfile(get('gemuesecurry-reis'))).toBe('vegan');
		expect(recipeDietProfile(get('kuerbissuppe'))).toBe('vegetarian');
		expect(recipeDietProfile(get('spaghetti-bolognese'))).toBe('meat-with-vegi');
		expect(recipeDietProfile(get('hackbraten'))).toBe('meat-only');
	});
});

describe('vegiShare', () => {
	it('is the vegetarian+vegan fraction of the group', () => {
		expect(vegiShare(4, 2, 20)).toBeCloseTo(0.3, 5);
		expect(vegiShare(0, 0, 20)).toBe(0);
	});
});

describe('sortRecipesByDiet', () => {
	it('puts vegetarian dishes first for a vegetarian majority', () => {
		const list = [get('hackbraten'), get('gemuesecurry-reis'), get('spaghetti-bolognese')];
		const sorted = sortRecipesByDiet(list, 0.7);
		expect(recipeDietProfile(sorted[0])).not.toBe('meat-only');
		expect(recipeDietProfile(sorted[sorted.length - 1])).toBe('meat-only');
	});

	it('keeps original order when there are no vegetarians', () => {
		const list = [get('hackbraten'), get('gemuesecurry-reis')];
		expect(sortRecipesByDiet(list, 0).map((r) => r.id)).toEqual(list.map((r) => r.id));
	});
});

describe('vegiPortions', () => {
	it('sums vegetarians and vegans', () => {
		expect(vegiPortions(3, 1)).toBe(4);
		expect(vegiPortions(0, 0)).toBe(0);
	});
});

describe('recipeIsCold', () => {
	it('recognises a cold pasta salad by name and a warm curry as not cold', () => {
		expect(recipeIsCold(get('pastasalat'))).toBe(true);
		expect(recipeIsCold(get('gemuesecurry-reis'))).toBe(false);
	});
});

describe('sortRecipesSmart', () => {
	it('keeps meat-only last for a vegetarian majority', () => {
		const list = [get('hackbraten'), get('gemuesecurry-reis'), get('spaghetti-bolognese')];
		const sorted = sortRecipesSmart(list, { share: 0.7 });
		expect(recipeDietProfile(sorted[sorted.length - 1])).toBe('meat-only');
	});
});

describe('mealDietStatus', () => {
	it('flags a meat-only dish when vegetarians are present', () => {
		const s = mealDietStatus(get('hackbraten'), 0.3);
		expect(s.ok).toBe(false);
		expect(s.hint).toBeTruthy();
	});

	it('accepts a veggie dish for everyone', () => {
		expect(mealDietStatus(get('gemuesecurry-reis'), 0.7).ok).toBe(true);
	});

	it('accepts a meat dish with a veggie variant', () => {
		const s = mealDietStatus(get('spaghetti-bolognese'), 0.3);
		expect(s.ok).toBe(true);
	});
});
