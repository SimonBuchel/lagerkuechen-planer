import { describe, expect, it } from 'vitest';
import { leftoverWarnings, mealGapWarnings, varietyWarnings } from './checks';

describe('mealGapWarnings', () => {
	it('warns about a gap over 5 hours', () => {
		const w = mealGapWarnings(['07:30', '12:00', '18:30']); // 4.5 h, then 6.5 h
		expect(w).toHaveLength(1);
		expect(w[0]).toContain('12:00');
		expect(w[0]).toContain('18:30');
	});

	it('is quiet when meals are close enough', () => {
		expect(mealGapWarnings(['07:30', '12:00', '16:00', '19:00'])).toEqual([]);
	});
});

describe('varietyWarnings', () => {
	it('flags the same main dish twice within four days', () => {
		const w = varietyWarnings([['spaghetti'], ['risotto'], ['spaghetti'], ['salat']]);
		expect(w).toHaveLength(1);
		expect(w[0]).toMatchObject({ day: 2, dish: 'spaghetti', clashesWith: 0 });
	});

	it('does not flag a repeat outside the window', () => {
		const w = varietyWarnings([['spaghetti'], ['a'], ['b'], ['c'], ['spaghetti']]);
		expect(w).toEqual([]); // day 4 vs day 0 is 5 days apart
	});
});

describe('leftoverWarnings', () => {
	it('warns per fresh ingredient on the last day', () => {
		const w = leftoverWarnings(['Frischfleisch', 'Salat']);
		expect(w).toHaveLength(2);
		expect(w[0]).toContain('Frischfleisch');
	});
});
