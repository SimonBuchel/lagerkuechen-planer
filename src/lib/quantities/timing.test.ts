import { describe, expect, it } from 'vitest';
import { cookingConflicts, cookingWindow, toHHMM, toMinutes, wakeUpTime } from './timing';

describe('toMinutes / toHHMM', () => {
	it('round-trips a time', () => {
		expect(toMinutes('07:30')).toBe(450);
		expect(toHHMM(450)).toBe('07:30');
	});

	it('wraps negative minutes into the previous day', () => {
		expect(toHHMM(-30)).toBe('23:30');
	});

	it('throws on malformed input', () => {
		expect(() => toMinutes('7h30')).toThrow();
		expect(() => toMinutes('25:00')).toThrow();
	});
});

describe('wakeUpTime', () => {
	it('works back from the first meal by prep time and buffer', () => {
		// Zmorge 07:30, 45 min prep, 15 min buffer -> 06:30.
		const r = wakeUpTime('07:30', 45, 15);
		expect(r.time).toBe('06:30');
		expect(r.crossesMidnight).toBe(false);
	});

	it('flags a get-up time that crosses midnight', () => {
		const r = wakeUpTime('00:30', 45, 15);
		expect(r.crossesMidnight).toBe(true);
		expect(r.time).toBe('23:30');
	});
});

describe('cookingWindow', () => {
	it('spans from meal minus prep time to the meal', () => {
		expect(cookingWindow('12:00', 90)).toEqual({ start: '10:30', end: '12:00' });
	});
});

describe('cookingConflicts', () => {
	const cooking = cookingWindow('12:00', 90); // 10:30 - 12:00

	it('finds a programme slot that overlaps the cooking window', () => {
		const conflicts = cookingConflicts(cooking, [
			{ start: '11:00', end: '13:00', title: 'Geländespiel' },
			{ start: '14:00', end: '15:00', title: 'Baden' }
		]);
		expect(conflicts.map((c) => c.title)).toEqual(['Geländespiel']);
	});

	it('returns nothing when the kitchen team is free', () => {
		expect(
			cookingConflicts(cooking, [{ start: '12:00', end: '13:00', title: 'Zmittag essen' }])
		).toEqual([]);
	});
});
