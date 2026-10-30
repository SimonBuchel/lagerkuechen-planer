import { describe, expect, it } from 'vitest';
import { analyzeGrobprogramm } from './grobprogramm';
import type { PageGeometry, Word } from './types';

function w(text: string, x0: number, top: number): Word {
	return { text, x0, x1: x0 + text.length * 6, top, bottom: top + 8 };
}

/** One page: two day columns, a 3-point time axis and a few activities. */
function samplePage(): PageGeometry {
	return {
		width: 842,
		height: 600,
		rects: [],
		words: [
			// day headers → columns (boundary at x=275)
			w('Fr 23.10.2026', 150, 56),
			w('Sa 24.10.2026', 400, 56),
			// margin time axis: 07:00→cy104, 08:00→cy128 (24px/h), 12:00→cy224
			w('07:00', 33, 100),
			w('07:00', 790, 100),
			w('08:00', 33, 124),
			w('08:00', 790, 124),
			w('12:00', 33, 220),
			w('12:00', 790, 220),
			// day 0 (Fr) activities
			w('ES Zmorge', 160, 100), // cy104 → 07:00
			w('LP 1.1 Morgensport', 160, 124), // cy128 → 08:00, number stripped
			// wrapped title continuation
			w('LS 5.1 Gelände-', 160, 140), // cy144
			w('spiel', 162, 152), // cy156, 12px below → joins → "Geländespiel"
			// day 1 (Sa) activity
			w('ES Zmittag', 410, 220), // cy224 → 12:00, col1
			// noise that must be ignored
			w('SA', 320, 120), // responsible initials
			w('Tagesverantwortliche: Fips', 160, 70),
			w('Grobprogramm Hauptlager', 30, 40)
		],
		docProducer: 'PDFKit'
	};
}

describe('analyzeGrobprogramm', () => {
	const prog = analyzeGrobprogramm([samplePage()], { fallbackYear: 2026 });

	it('finds the two day columns with ISO dates', () => {
		expect(prog.days.map((d) => d.date)).toEqual(['2026-10-23', '2026-10-24']);
	});

	it('assigns activities to the correct day and category', () => {
		const fr = prog.days[0];
		const sa = prog.days[1];
		expect(fr.blocks.map((b) => b.category)).toContain('ES');
		expect(fr.blocks.find((b) => b.title === 'Zmorge')?.category).toBe('ES');
		expect(sa.blocks.map((b) => b.title)).toEqual(['Zmittag']);
		expect(sa.blocks[0].category).toBe('ES');
	});

	it('reads start times off the decoded axis', () => {
		const fr = prog.days[0];
		expect(fr.blocks.find((b) => b.title === 'Zmorge')?.start).toBe('07:00');
		expect(fr.blocks.find((b) => b.title === 'Morgensport')?.start).toBe('08:00');
		expect(prog.timeAxis.anchorSource).toBe('decoded');
		expect(Math.round(prog.timeAxis.hourHeight)).toBe(24);
	});

	it('strips leading numbers and joins wrapped titles', () => {
		const titles = prog.days[0].blocks.map((b) => b.title);
		expect(titles).toContain('Morgensport');
		expect(titles).toContain('Geländespiel');
	});

	it('ignores responsible codes, headers and the Grobprogramm label', () => {
		const allTitles = prog.days.flatMap((d) => d.blocks.map((b) => b.title));
		expect(allTitles).not.toContain('SA');
		expect(allTitles.some((t) => t.includes('Tagesverantwortliche'))).toBe(false);
		expect(allTitles.some((t) => t.includes('Grobprogramm'))).toBe(false);
	});
});
