import { describe, expect, it } from 'vitest';
import {
	AI_PLAN_SLOTS,
	aiPlanSchema,
	buildAiMessages,
	buildRecipeCatalog,
	validateAssignment,
	type AiPlanInput
} from './ai';

function sampleInput(): AiPlanInput {
	const catalog = buildRecipeCatalog();
	return {
		days: [
			{ index: 0, date: '2026-07-14', label: 'Tag 1', activities: [] },
			{ index: 1, date: '2026-07-15', label: 'Tag 2', activities: ['Wanderung'] }
		],
		heads: 30,
		vegiPercent: 20,
		dietSummary: '4 vegetarisch, 2 vegan',
		allergies: [{ pseudonym: 'TN-07', severity: 'anaphylaxie', allergens: ['nuts'] }],
		budgetTarget: 12,
		catalog
	};
}

describe('buildRecipeCatalog', () => {
	it('lists recipes for every planning slot with a diet profile', () => {
		const catalog = buildRecipeCatalog();
		expect(catalog.length).toBeGreaterThan(0);
		for (const entry of catalog) {
			expect(AI_PLAN_SLOTS).toContain(entry.slot);
			expect(entry.id).toBeTruthy();
			expect(['vegan', 'vegetarian', 'meat-with-vegi', 'meat-only']).toContain(entry.diet);
		}
	});
});

describe('aiPlanSchema', () => {
	it('constrains each slot to its own recipe ids plus empty', () => {
		const input = sampleInput();
		const schema = aiPlanSchema(input) as {
			properties: { days: { items: { required: string[]; properties: Record<string, { enum: string[] }> } } };
		};
		const item = schema.properties.days.items;
		expect(item.required).toEqual([...AI_PLAN_SLOTS]);
		for (const slot of AI_PLAN_SLOTS) {
			const enums = item.properties[slot].enum;
			expect(enums).toContain('');
			const idsForSlot = input.catalog.filter((c) => c.slot === slot).map((c) => c.id);
			for (const id of idsForSlot) expect(enums).toContain(id);
		}
	});
});

describe('validateAssignment', () => {
	it('keeps valid ids and drops unknown ones', () => {
		const input = sampleInput();
		const zmittag = input.catalog.find((c) => c.slot === 'zmittag')!;
		const raw = {
			days: [
				{ zmorge: '', zmittag: zmittag.id, znacht: 'does-not-exist', zvieri: '', dessert: '' },
				{ zmorge: '', zmittag: 'nope', znacht: '', zvieri: '', dessert: '' }
			]
		};
		const out = validateAssignment(input, raw);
		expect(out.days).toHaveLength(2);
		expect(out.days[0].zmittag).toBe(zmittag.id);
		expect(out.days[0].znacht).toBeNull();
		expect(out.days[1].zmittag).toBeNull();
	});

	it('never throws on a malformed answer', () => {
		const input = sampleInput();
		const out = validateAssignment(input, { garbage: true });
		expect(out.days).toHaveLength(input.days.length);
		for (const day of out.days) {
			for (const slot of AI_PLAN_SLOTS) expect(day[slot]).toBeNull();
		}
	});
});

describe('buildAiMessages', () => {
	it('produces a rules system prompt and valid JSON user payload', () => {
		const input = sampleInput();
		const { system, user } = buildAiMessages(input);
		expect(system).toContain('Vegi');
		expect(system).toContain('Abwechslung');
		const parsed = JSON.parse(user);
		expect(parsed.tage).toHaveLength(input.days.length);
		expect(parsed.lager.personen).toBe(30);
	});
});
