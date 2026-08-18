import { describe, expect, it } from 'vitest';
import { isConsentCurrent, recordConsent, CONSENT_VERSION } from './consent';
import {
	deletionDueDate,
	isPersonalData,
	partitionForDeletion,
	retentionStatus,
	type DataCategory
} from './retention';

describe('deletionDueDate', () => {
	it('is 90 days after camp end', () => {
		expect(deletionDueDate('2026-07-25')).toBe('2026-10-23');
	});
});

describe('retentionStatus', () => {
	it('is not due long before the date', () => {
		const s = retentionStatus('2026-07-25', '2026-08-01');
		expect(s.isDue).toBe(false);
		expect(s.shouldWarn).toBe(false);
		expect(s.daysUntilDue).toBeGreaterThan(7);
	});

	it('warns within the warning window', () => {
		const s = retentionStatus('2026-07-25', '2026-10-20'); // 3 days before due
		expect(s.isDue).toBe(false);
		expect(s.shouldWarn).toBe(true);
	});

	it('is due on and after the deletion date', () => {
		expect(retentionStatus('2026-07-25', '2026-10-23').isDue).toBe(true);
		expect(retentionStatus('2026-07-25', '2026-12-01').isDue).toBe(true);
	});
});

describe('isPersonalData / partitionForDeletion', () => {
	it('treats persons, allergies and consent as personal', () => {
		expect(isPersonalData('person')).toBe(true);
		expect(isPersonalData('allergy')).toBe(true);
		expect(isPersonalData('recipe')).toBe(false);
	});

	it('keeps recipes and templates, deletes personal data', () => {
		const records: { category: DataCategory; id: number }[] = [
			{ category: 'person', id: 1 },
			{ category: 'allergy', id: 2 },
			{ category: 'recipe', id: 3 },
			{ category: 'template', id: 4 }
		];
		const { toDelete, toKeep } = partitionForDeletion(records);
		expect(toDelete.map((r) => r.id)).toEqual([1, 2]);
		expect(toKeep.map((r) => r.id)).toEqual([3, 4]);
	});
});

describe('consent', () => {
	it('records the current version with a timestamp', () => {
		const c = recordConsent('Lagerleitung', new Date('2026-05-01T10:00:00Z'));
		expect(c.version).toBe(CONSENT_VERSION);
		expect(c.grantedAt).toBe('2026-05-01T10:00:00.000Z');
		expect(isConsentCurrent(c)).toBe(true);
	});

	it('flags an outdated consent version', () => {
		expect(isConsentCurrent({ version: '2000-01', grantedAt: '', confirmedByRole: '' })).toBe(
			false
		);
		expect(isConsentCurrent(null)).toBe(false);
	});
});
