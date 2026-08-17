import { describe, expect, it } from 'vitest';
import {
	extractResponsible,
	groupWordsIntoLines,
	joinLines,
	reconstructBlockText,
	stripCategoryPrefix,
	stripEmails,
	stripPua
} from './text';
import type { Word } from './types';

/** Helper to build a Word at a given position. */
function w(text: string, x0: number, top: number): Word {
	return { text, x0, x1: x0 + text.length * 5, top, bottom: top + 10 };
}

describe('stripPua', () => {
	it('removes Private-Use-Area characters', () => {
		expect(stripPua('Wanderung')).toBe('Wanderung');
	});

	it('keeps normal text untouched', () => {
		expect(stripPua('Zmittag 12:00')).toBe('Zmittag 12:00');
	});
});

describe('joinLines', () => {
	it('joins a mid-word wrap without a space', () => {
		// "Wande" + "rung" -> next line starts lowercase -> glue
		expect(joinLines(['Wande', 'rung'])).toBe('Wanderung');
	});

	it('joins with a space when the next line starts uppercase', () => {
		expect(joinLines(['Znacht', 'Spaghetti'])).toBe('Znacht Spaghetti');
	});

	it('joins with a space when the previous line ends on punctuation', () => {
		expect(joinLines(['Znacht:', 'spaghetti'])).toBe('Znacht: spaghetti');
	});

	it('ignores empty lines', () => {
		expect(joinLines(['Ausflug', '', 'See'])).toBe('Ausflug See');
	});
});

describe('groupWordsIntoLines', () => {
	it('groups words on the same baseline and orders them left to right', () => {
		const words = [w('See', 40, 20), w('zum', 20, 20), w('Ausflug', 10, 8)];
		const lines = groupWordsIntoLines(words);
		expect(lines).toHaveLength(2);
		expect(lines[0].map((x) => x.text)).toEqual(['Ausflug']);
		expect(lines[1].map((x) => x.text)).toEqual(['zum', 'See']);
	});
});

describe('extractResponsible', () => {
	it('splits [..] content into the responsible field', () => {
		const r = extractResponsible('Znacht kochen [Anna, Beat]');
		expect(r.title).toBe('Znacht kochen');
		expect(r.responsible).toBe('Anna, Beat');
	});

	it('returns null responsible when there is no bracket', () => {
		expect(extractResponsible('Zmorge').responsible).toBeNull();
	});
});

describe('stripEmails', () => {
	it('removes e-mail addresses (never persisted)', () => {
		expect(stripEmails('Leitung anna@example.ch Zvieri')).toBe('Leitung Zvieri');
	});
});

describe('stripCategoryPrefix', () => {
	it('splits a leading ES: prefix and reports the code', () => {
		const r = stripCategoryPrefix('ES: Zmittag');
		expect(r.code).toBe('ES');
		expect(r.rest).toBe('Zmittag');
	});

	it('leaves untagged text alone', () => {
		const r = stripCategoryPrefix('Wanderung');
		expect(r.code).toBeNull();
		expect(r.rest).toBe('Wanderung');
	});
});

describe('reconstructBlockText', () => {
	it('runs the full pipeline: wrap across lines, responsible, email, prefix', () => {
		const words = [
			w('LA:', 10, 5),
			w('Nacht', 40, 5),
			w('wanderung', 10, 18), // word wrapped onto the next line
			w('[Kochteam]', 10, 31),
			w('koch@camp.ch', 90, 31)
		];
		const r = reconstructBlockText(words);
		expect(r.title).toBe('Nachtwanderung');
		expect(r.responsible).toBe('Kochteam');
		expect(r.prefixCode).toBe('LA');
	});
});
