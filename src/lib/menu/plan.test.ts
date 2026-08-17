import { describe, expect, it } from 'vitest';
import type { ParsedProgram } from '../parser/types';
import { autoAssign, buildPlan, recipeById, recipesForSlot } from './plan';

function programOf(dayCount: number): ParsedProgram {
	return {
		camp: null,
		periods: [],
		days: Array.from({ length: dayCount }, (_, i) => ({
			date: `2026-07-${String(12 + i).padStart(2, '0')}`,
			blocks: []
		})),
		timeAxis: { hourHeight: 0, anchorTop: 0, anchorHour: 7, anchorSource: 'default' },
		legend: [],
		warnings: []
	};
}

describe('buildPlan', () => {
	it('creates one empty menu day per programme day', () => {
		const plan = buildPlan(programOf(3));
		expect(plan.days).toHaveLength(3);
		expect(plan.days[0].slots.zmittag).toBeNull();
	});
});

describe('recipesForSlot', () => {
	it('returns several lunch options', () => {
		expect(recipesForSlot('zmittag').length).toBeGreaterThan(3);
	});
});

describe('autoAssign', () => {
	it('fills lunch every day and varies consecutive days', () => {
		const plan = autoAssign(buildPlan(programOf(5)));
		const lunches = plan.days.map((d) => d.slots.zmittag);
		expect(lunches.every((l) => l !== null)).toBe(true);
		for (let i = 1; i < lunches.length; i++) {
			expect(lunches[i]).not.toBe(lunches[i - 1]); // no back-to-back repeat
		}
		expect(recipeById(lunches[0])).toBeDefined();
	});

	it('keeps a user-set assignment', () => {
		const base = buildPlan(programOf(3));
		base.days[1].slots.zmittag = 'kuerbissuppe';
		const plan = autoAssign(base);
		expect(plan.days[1].slots.zmittag).toBe('kuerbissuppe');
	});
});
