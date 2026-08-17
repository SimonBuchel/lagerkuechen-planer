import { describe, expect, it } from 'vitest';
import {
	checkEquipment,
	requiredKettleLiters,
	ruestPersonenminuten,
	seasoningCorrection
} from './kessel';
import type { CookingRequirement, KitchenEquipment } from './types';

describe('seasoningCorrection', () => {
	it('scales linearly below the threshold', () => {
		expect(seasoningCorrection('gewuerz', 3)).toBe(1);
		expect(seasoningCorrection('salz', 3.9)).toBe(1);
	});

	it('damps seasonings at and above factor 4', () => {
		expect(seasoningCorrection('gewuerz', 4)).toBe(0.75);
		expect(seasoningCorrection('salz', 10)).toBe(0.8);
		expect(seasoningCorrection('bratfett', 8)).toBe(0.6);
	});
});

describe('requiredKettleLiters', () => {
	it('adds head-room so the kettle does not boil over', () => {
		// 30 l of food at 0.8 fill ratio -> 37.5 l kettle.
		expect(requiredKettleLiters(30000)).toBeCloseTo(37.5, 1);
	});

	it('is zero for no volume', () => {
		expect(requiredKettleLiters(0)).toBe(0);
	});
});

describe('ruestPersonenminuten', () => {
	it('combines a fixed setup with a per-portion part', () => {
		expect(ruestPersonenminuten(20, 0.5, 40)).toBe(40); // 20 + 0.5*40
	});
});

describe('checkEquipment', () => {
	const kitchen: KitchenEquipment = {
		gasbrenner: 2,
		kesselLiter: [20, 30],
		backofen: false,
		kuehlkapazitaetLiter: 100
	};

	it('passes when the kitchen is sufficient', () => {
		const req: CookingRequirement = {
			kesselLiter: 25,
			kochstellen: 2,
			brauchtOfen: false,
			ruestPersonenminuten: 60
		};
		expect(checkEquipment(req, kitchen)).toEqual([]);
	});

	it('warns when the largest kettle is too small', () => {
		const req: CookingRequirement = {
			kesselLiter: 40,
			kochstellen: 1,
			brauchtOfen: false,
			ruestPersonenminuten: 30
		};
		const w = checkEquipment(req, kitchen);
		expect(w).toHaveLength(1);
		expect(w[0].kind).toBe('kessel');
	});

	it('warns about too few cooking stations and a missing oven', () => {
		const req: CookingRequirement = {
			kesselLiter: 10,
			kochstellen: 3,
			brauchtOfen: true,
			ruestPersonenminuten: 30
		};
		const kinds = checkEquipment(req, kitchen).map((x) => x.kind);
		expect(kinds).toContain('kochstellen');
		expect(kinds).toContain('ofen');
	});
});
