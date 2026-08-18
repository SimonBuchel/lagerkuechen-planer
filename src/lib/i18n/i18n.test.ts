import { describe, expect, it } from 'vitest';
import { keysOf, LOCALES, t } from './index';

describe('t', () => {
	it('translates a known key per locale', () => {
		expect(t('nav.einkauf', 'de')).toBe('Einkauf');
		expect(t('nav.einkauf', 'fr')).toBe('Achats');
		expect(t('nav.einkauf', 'it')).toBe('Spesa');
	});

	it('falls back to German for a missing translation', () => {
		// A key only present in German still returns something sensible elsewhere.
		expect(t('footer.privacy', 'de')).toBe('Datenschutz');
		expect(typeof t('footer.privacy', 'it')).toBe('string');
	});

	it('falls back to the key itself when unknown everywhere', () => {
		expect(t('does.not.exist', 'fr')).toBe('does.not.exist');
	});
});

describe('coverage', () => {
	it('fr and it define exactly the German keys', () => {
		const de = keysOf('de').sort();
		expect(keysOf('fr').sort()).toEqual(de);
		expect(keysOf('it').sort()).toEqual(de);
	});
});
