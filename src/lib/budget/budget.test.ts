import { describe, expect, it } from 'vitest';
import type { MenuPlan } from '../menu/plan';
import type { DietComposition, PersonGroup } from '../quantities/types';
import { computeBudget, type BudgetContext } from './budget';
import { priceFor } from './prices';

const groups: PersonGroup[] = [{ role: 'teilnehmende', ageBand: '11-14', count: 30 }];
const noDiet: DietComposition = {
	vegetarisch: 0,
	vegan: 0,
	halal: 0,
	koscher: 0,
	laktosefrei: 0,
	glutenfrei: 0
};

function plan(recipeId: string, days: number): MenuPlan {
	return {
		days: Array.from({ length: days }, (_, i) => ({
			date: `2026-07-1${i}`,
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

describe('priceFor', () => {
	it('prices per base unit from the estimate table', () => {
		expect(priceFor('Hackfleisch', 'g')).toBeCloseTo(0.015, 5); // 15 CHF/kg
		expect(priceFor('Milch', 'ml')).toBeCloseTo(0.0016, 5); // 1.6 CHF/l
		expect(priceFor('Eier', 'stk')).toBe(0.5);
	});

	it('honours overrides', () => {
		expect(priceFor('Hackfleisch', 'g', { Hackfleisch: 0.02 })).toBe(0.02);
	});
});

describe('computeBudget', () => {
	const ctx: BudgetContext = { groups, diet: noDiet, activity: 'normal', budgetPerPersonDay: 12 };
	const summary = computeBudget(plan('spaghetti-bolognese', 3), ctx);

	it('sums a positive planned total and per-meal costs', () => {
		expect(summary.plannedTotal).toBeGreaterThan(0);
		expect(summary.days[0].meals[0].cost).toBeGreaterThan(0);
		expect(summary.days[0].meals[0].recipeName).toBe('Spaghetti Bolognese');
	});

	it('computes the target from person-days and the daily target', () => {
		expect(summary.personDays).toBe(90); // 30 heads * 3 days
		expect(summary.targetTotal).toBe(1080); // 90 * 12
	});

	it('reports planned CHF per person and day', () => {
		expect(summary.plannedPerPersonDay).toBeGreaterThan(0);
		expect(summary.targetPerPersonDay).toBe(12);
	});
});
