import { describe, expect, it } from 'vitest';
import {
	applyFeedback,
	dietFactor,
	effectivePersons,
	personFactor,
	scaleQuantity,
	shrinkageReserve,
	totalHeadcount
} from './scale';
import type { DietComposition, PersonGroup } from './types';

const noDiet: DietComposition = {
	vegetarisch: 0,
	vegan: 0,
	halal: 0,
	koscher: 0,
	laktosefrei: 0,
	glutenfrei: 0
};

describe('personFactor', () => {
	it('uses the age factor for participants', () => {
		expect(personFactor({ role: 'teilnehmende', ageBand: '11-14' })).toBe(0.9);
		expect(personFactor({ role: 'teilnehmende', ageBand: '6-10' })).toBe(0.7);
	});

	it('overrides with the role factor for leaders and kitchen team', () => {
		expect(personFactor({ role: 'leitende', ageBand: '18+' })).toBe(1.15);
		expect(personFactor({ role: 'kuechenteam', ageBand: '18+' })).toBe(1.2);
	});

	it('treats visitors by age band', () => {
		expect(personFactor({ role: 'besuch', ageBand: '18+' })).toBe(1.15);
	});
});

describe('totalHeadcount', () => {
	it('sums all group counts', () => {
		const groups: PersonGroup[] = [
			{ role: 'teilnehmende', ageBand: '11-14', count: 10 },
			{ role: 'leitende', ageBand: '18+', count: 2 }
		];
		expect(totalHeadcount(groups)).toBe(12);
	});
});

describe('effectivePersons', () => {
	const groups: PersonGroup[] = [
		{ role: 'teilnehmende', ageBand: '11-14', count: 10 }, // 10 * 0.9 = 9
		{ role: 'leitende', ageBand: '18+', count: 2 }, // 2 * 1.15 = 2.3
		{ role: 'kuechenteam', ageBand: '18+', count: 1 } // 1 * 1.2 = 1.2
	];

	it('weights head counts by person factor at normal activity', () => {
		expect(effectivePersons(groups, 'normal')).toBeCloseTo(12.5, 5);
	});

	it('applies the activity factor to everyone', () => {
		expect(effectivePersons(groups, 'sport')).toBeCloseTo(15, 5); // 12.5 * 1.2
		expect(effectivePersons(groups, 'ruhetag')).toBeCloseTo(11.875, 5); // 12.5 * 0.95
	});
});

describe('dietFactor', () => {
	const diet: DietComposition = { ...noDiet, vegetarisch: 4, vegan: 2 };

	it('is 1 for neutral ingredients', () => {
		expect(dietFactor('neutral', diet, 20)).toBe(1);
	});

	it('excludes vegetarians and vegans from meat', () => {
		expect(dietFactor('meat', diet, 20)).toBeCloseTo(0.7, 5); // (20-6)/20
	});

	it('excludes only vegans from animal products', () => {
		expect(dietFactor('animalProduct', diet, 20)).toBeCloseTo(0.9, 5); // (20-2)/20
	});

	it('counts only vegetarians and vegans for the meat alternative', () => {
		expect(dietFactor('meatAlternative', diet, 20)).toBeCloseTo(0.3, 5); // 6/20
	});

	it('returns 0 for zero people', () => {
		expect(dietFactor('meat', diet, 0)).toBe(0);
	});
});

describe('shrinkageReserve', () => {
	it('is 5 % for storable produce', () => {
		expect(shrinkageReserve('lagerfaehig')).toBe(0.05);
	});

	it('is 10 % for fresh produce', () => {
		expect(shrinkageReserve('frisch_3_tage')).toBe(0.1);
		expect(shrinkageReserve('frisch_1_tag')).toBe(0.1);
	});

	it('is 10 % on the first day even for storable produce', () => {
		expect(shrinkageReserve('lagerfaehig', true)).toBe(0.1);
	});
});

describe('scaleQuantity', () => {
	it('multiplies base × people × diet × (1 + shrinkage)', () => {
		expect(scaleQuantity(110, 12.5, 1, 0.05)).toBeCloseTo(1443.75, 2);
	});

	it('scales meat down by the diet factor', () => {
		expect(scaleQuantity(140, 20, 0.7, 0.05)).toBeCloseTo(2058, 2);
	});
});

describe('applyFeedback', () => {
	it('shrinks a portion that was too large', () => {
		expect(applyFeedback(110, 'zu_viel')).toBe(99);
	});

	it('grows a portion that was too small', () => {
		expect(applyFeedback(110, 'zu_wenig')).toBe(121);
	});

	it('leaves a correct portion unchanged', () => {
		expect(applyFeedback(110, 'richtig')).toBe(110);
	});
});
