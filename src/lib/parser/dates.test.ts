import { describe, expect, it } from 'vitest';
import { parseHeaderDate } from './dates';

describe('parseHeaderDate', () => {
	it('parses a full numeric date with year', () => {
		expect(parseHeaderDate('Mo 14.07.2025').iso).toBe('2025-07-14');
	});

	it('parses a two-digit year', () => {
		expect(parseHeaderDate('14.07.25').iso).toBe('2025-07-14');
	});

	it('uses the fallback year when the header omits it', () => {
		expect(parseHeaderDate('Di 15.7.', 2025).iso).toBe('2025-07-15');
	});

	it('returns null iso but keeps raw when year is unknown', () => {
		const r = parseHeaderDate('Mi 16.7.');
		expect(r.iso).toBeNull();
		expect(r.raw).toBe('Mi 16.7.');
	});

	it('parses a textual month', () => {
		expect(parseHeaderDate('14. Juli 2025').iso).toBe('2025-07-14');
	});

	it('rejects an impossible month', () => {
		expect(parseHeaderDate('40.13.2025').iso).toBeNull();
	});
});
