import { describe, expect, it } from 'vitest';
import { analyzePages } from './analyze';
import type { FilledRect, PageGeometry, RGB, Word } from './types';

const GREY: RGB = { r: 0.733, g: 0.733, b: 0.733 };
const ORANGE: RGB = { r: 1.0, g: 0.596, b: 0.0 };
const BLUE: RGB = { r: 0.565, g: 0.718, b: 0.894 };
const GREEN: RGB = { r: 0.302, g: 0.733, b: 0.322 };

function word(text: string, x0: number, top: number): Word {
	return { text, x0, x1: x0 + text.length * 6, top, bottom: top + 9 };
}

function block(x0: number, x1: number, top: number, bottom: number, fill: RGB): FilledRect {
	return { x0, x1, top, bottom, fill };
}

/** PUA glyph for a digit, mirroring eCamp's Type-3 axis font. */
function encodePua(hhmm: string): string {
	return [...hhmm]
		.map((c) => (c === ':' ? ':' : String.fromCodePoint(0xe070 + Number(c))))
		.join('');
}

/**
 * Builds a realistic single-page eCamp export:
 *  - legend swatches in the foot (grey/orange/blue/green),
 *  - a PUA-encoded hourly time axis anchored at 07:00 (20 pt/hour),
 *  - two day columns with a handful of blocks.
 */
function buildSamplePage(): PageGeometry {
	const rects: FilledRect[] = [
		// Legend swatches at the foot (> 0.8 * 800 = 640).
		block(20, 30, 760, 770, GREY),
		block(120, 130, 760, 770, ORANGE),
		block(220, 230, 760, 770, BLUE),
		block(320, 330, 760, 770, GREEN),
		// Day 1 column (x 40..260).
		block(40, 260, 100, 120, GREY), // ES Zmorge 07:00
		block(40, 260, 140, 180, ORANGE), // LA Wanderung 09:00
		// Day 2 column (x 280..500).
		block(280, 500, 100, 120, GREY), // ES Zmittag 07:00
		block(280, 500, 140, 180, BLUE) // LP Lagerolympiade 09:00
	];

	const words: Word[] = [
		// Time-axis labels on the left (x < 40), one per hour. Positioned so the
		// vertical centre of each label sits on its gridline (100, 120, 140, 160),
		// which is where the block top edges sit too.
		word(encodePua('07:00'), 5, 95.5),
		word(encodePua('08:00'), 5, 115.5),
		word(encodePua('09:00'), 5, 135.5),
		word(encodePua('10:00'), 5, 155.5),
		// Legend labels next to the foot swatches.
		word('Essen', 34, 760),
		word('Lageraktivität', 134, 760),
		word('Lagerprogramm', 234, 760),
		word('Lagersport', 334, 760),
		// Column headers.
		word('Mo', 45, 60),
		word('14.07.2025', 70, 60),
		word('Di', 285, 60),
		word('15.07.2025', 310, 60),
		// Day 1 block texts.
		word('ES:', 45, 104),
		word('Zmorge', 75, 104),
		word('LA:', 45, 145),
		word('Wanderung', 75, 145),
		word('[Anna]', 160, 145),
		// Day 2 block texts.
		word('Zmittag', 285, 104),
		word('LP:', 285, 145),
		word('Lagerolympiade', 315, 145)
	];

	return {
		width: 540,
		height: 800,
		rects,
		words,
		docTitle: JSON.stringify({ camp: '/camps/test1', periods: ['/periods/p1'] })
	};
}

describe('analyzePages – happy path', () => {
	const program = analyzePages([buildSamplePage()]);

	it('reads camp and period metadata from the title', () => {
		expect(program.camp).toBe('/camps/test1');
		expect(program.periods).toEqual(['/periods/p1']);
	});

	it('derives the time axis and decodes the 07:00 anchor', () => {
		expect(program.timeAxis.hourHeight).toBeCloseTo(20, 1);
		expect(program.timeAxis.anchorHour).toBe(7);
		expect(program.timeAxis.anchorSource).toBe('decoded');
	});

	it('produces two days with parsed dates', () => {
		expect(program.days).toHaveLength(2);
		expect(program.days[0].date).toBe('2025-07-14');
		expect(program.days[1].date).toBe('2025-07-15');
	});

	it('reconstructs blocks with category, time, title and responsible', () => {
		const day1 = program.days[0];
		const zmorge = day1.blocks.find((b) => b.title === 'Zmorge');
		expect(zmorge?.category).toBe('ES');
		expect(zmorge?.start).toBe('07:00');

		const wanderung = day1.blocks.find((b) => b.title === 'Wanderung');
		expect(wanderung?.category).toBe('LA');
		expect(wanderung?.start).toBe('09:00');
		expect(wanderung?.responsible).toBe('Anna');
	});

	it('classifies the second column via the learned legend', () => {
		const olympiade = program.days[1].blocks.find((b) => b.title === 'Lagerolympiade');
		expect(olympiade?.category).toBe('LP');
	});

	it('has no warnings for a clean page', () => {
		expect(program.warnings).toEqual([]);
	});
});

describe('analyzePages – error cases', () => {
	it('warns when the legend is missing but still classifies via reference palette', () => {
		const page = buildSamplePage();
		// Drop the legend swatches (the four foot rects).
		page.rects = page.rects.filter((r) => r.top < 700);
		const program = analyzePages([page]);
		expect(program.warnings.some((w) => w.includes('Keine Legende'))).toBe(true);
		// Reference palette still recognises grey as ES.
		const zmorge = program.days[0].blocks.find((b) => b.title === 'Zmorge');
		expect(zmorge?.category).toBe('ES');
	});

	it('flags a block with an unknown colour', () => {
		const page = buildSamplePage();
		// Recolour the Wanderung block to an off-palette purple.
		const target = page.rects.find((r) => r.top === 140 && r.x0 === 40)!;
		target.fill = { r: 0.6, g: 0.1, b: 0.7 };
		const program = analyzePages([page]);
		// Category recovered from the "LA:" text prefix, with a warning.
		expect(program.warnings.some((w) => w.includes('Unbekannte Blockfarbe'))).toBe(true);
	});

	it('warns on an empty page with no columns', () => {
		const empty: PageGeometry = { width: 540, height: 800, rects: [], words: [] };
		const program = analyzePages([empty]);
		expect(program.days).toEqual([]);
		expect(program.warnings.some((w) => w.includes('Keine Tagesspalten'))).toBe(true);
	});
});
