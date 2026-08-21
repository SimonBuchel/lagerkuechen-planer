import { describe, expect, it } from 'vitest';
import { autoAssign, MENU_SLOTS } from './plan';
import { recipeById } from '../recipes/registry';
import { recipeIsHeavy } from './diet';
import type { MealSlot } from '../rules/types';

function emptyPlan(n: number) {
	const slots = () =>
		Object.fromEntries(MENU_SLOTS.map((s) => [s, null])) as Record<MealSlot, string | null>;
	return { days: Array.from({ length: n }, () => ({ date: null, slots: slots() })) };
}

describe('autoAssign smart planning', () => {
	it('never assigns an oven dish when the kitchen has no oven', () => {
		const plan = autoAssign(emptyPlan(8), { exclude: (r) => r.cooking.brauchtOfen });
		for (const d of plan.days) {
			for (const slot of ['zmittag', 'znacht'] as MealSlot[]) {
				const r = recipeById(d.slots[slot]);
				if (r) expect(r.cooking.brauchtOfen).toBe(false);
			}
		}
	});

	it('does not put heavy mains on consecutive days', () => {
		const plan = autoAssign(emptyPlan(10), {});
		const maxHeavyRun = (slot: MealSlot) => {
			let run = 0;
			let max = 0;
			for (const d of plan.days) {
				const r = recipeById(d.slots[slot]);
				run = r && recipeIsHeavy(r) ? run + 1 : 0;
				max = Math.max(max, run);
			}
			return max;
		};
		expect(maxHeavyRun('zmittag')).toBeLessThanOrEqual(1);
		expect(maxHeavyRun('znacht')).toBeLessThanOrEqual(1);
	});

	it('does not plan dessert or Zvieri on every day by default', () => {
		const plan = autoAssign(emptyPlan(8), {});
		const withDessert = plan.days.filter((d) => d.slots.dessert).length;
		const withZvieri = plan.days.filter((d) => d.slots.zvieri).length;
		expect(withDessert).toBeLessThan(plan.days.length);
		expect(withZvieri).toBe(0); // none unless the caller marks active days
	});
});

describe('recipeIsHeavy', () => {
	it('flags rich dishes and clears light ones', () => {
		expect(recipeIsHeavy(recipeById('aelplermagronen')!)).toBe(true);
		expect(recipeIsHeavy(recipeById('gemuesecurry-reis')!)).toBe(false);
	});
});
