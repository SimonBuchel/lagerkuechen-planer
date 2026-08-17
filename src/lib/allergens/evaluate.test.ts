import { describe, expect, it } from 'vitest';
import { ALLERGEN_KEYS, allergenLabel } from './data';
import { evaluateMeal, mealAllergenSources, type AllergenTaggedIngredient } from './evaluate';
import type { AllergyProfile } from './types';

const spaghetti: AllergenTaggedIngredient[] = [
	{ name: 'Teigwaren', allergens: ['gluten'] },
	{ name: 'Hackfleisch', allergens: [] },
	{ name: 'Hartkäse', allergens: ['milch'] },
	{ name: 'Tomatensauce', allergens: [] }
];

describe('controlled list', () => {
	it('has 17 allergens (14 declarable + 3 extra)', () => {
		expect(ALLERGEN_KEYS.size).toBe(17);
	});

	it('labels a key', () => {
		expect(allergenLabel('milch')).toBe('Milch (Laktose)');
	});
});

describe('mealAllergenSources', () => {
	it('maps each allergen to the ingredients that carry it', () => {
		const sources = mealAllergenSources(spaghetti);
		expect(sources.get('gluten')).toEqual(['Teigwaren']);
		expect(sources.get('milch')).toEqual(['Hartkäse']);
		expect(sources.has('eier')).toBe(false);
	});
});

describe('evaluateMeal', () => {
	const profiles: AllergyProfile[] = [
		{ pseudonym: 'TN-03', allergens: ['gluten'], severity: 'allergie' },
		{ pseudonym: 'TN-07', allergens: ['erdnuesse'], severity: 'anaphylaxie' },
		{ pseudonym: 'TN-11', allergens: ['milch'], severity: 'anaphylaxie' }
	];

	const evaluation = evaluateMeal(spaghetti, profiles);

	it('flags who cannot eat the meal and why', () => {
		const tn03 = evaluation.perProfile.find((p) => p.pseudonym === 'TN-03')!;
		expect(tn03.canEat).toBe(false);
		expect(tn03.triggeredBy).toEqual(['gluten']);
		expect(tn03.offendingIngredients).toEqual(['Teigwaren']);
	});

	it('lets an unaffected severe case eat the meal', () => {
		const tn07 = evaluation.perProfile.find((p) => p.pseudonym === 'TN-07')!;
		expect(tn07.canEat).toBe(true); // no peanuts in this meal
	});

	it('lists the affected pseudonyms', () => {
		expect(evaluation.affected.sort()).toEqual(['TN-03', 'TN-11']);
	});

	it('emits a hard warning only for an affected anaphylaxis case', () => {
		expect(evaluation.anaphylaxisWarnings).toHaveLength(1); // TN-11 (milk), not TN-07
		expect(evaluation.anaphylaxisWarnings[0]).toContain('TN-11');
		expect(evaluation.anaphylaxisWarnings[0]).toContain('Kreuzkontamination');
	});
});
