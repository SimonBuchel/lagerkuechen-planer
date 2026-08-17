import { describe, expect, it } from 'vitest';
import { parseTitleMetadata } from './metadata';

describe('parseTitleMetadata', () => {
	it('extracts camp and periods from a JSON title', () => {
		const title = JSON.stringify({
			camp: '/camps/abc123',
			config: 'picasso',
			periods: ['/periods/p1', '/periods/p2']
		});
		const meta = parseTitleMetadata(title);
		expect(meta.camp).toBe('/camps/abc123');
		expect(meta.periods).toEqual(['/periods/p1', '/periods/p2']);
	});

	it('finds embedded JSON inside a longer title string', () => {
		const title = 'eCamp Print {"camp":"/camps/x","periods":["/periods/y"]} v3';
		const meta = parseTitleMetadata(title);
		expect(meta.camp).toBe('/camps/x');
		expect(meta.periods).toEqual(['/periods/y']);
	});

	it('falls back to regex extraction for malformed JSON', () => {
		const title = '{"camp":"/camps/z", "periods":["/periods/a", oops }';
		const meta = parseTitleMetadata(title);
		expect(meta.camp).toBe('/camps/z');
		expect(meta.periods).toEqual(['/periods/a']);
	});

	it('returns empty result for missing title', () => {
		expect(parseTitleMetadata(undefined)).toEqual({ camp: null, periods: [] });
	});
});
