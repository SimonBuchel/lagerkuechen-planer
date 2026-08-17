/**
 * End-to-end test through pdf.js.
 *
 * The pure analysis pipeline is covered by analyze.test.ts with hand-built
 * geometry. This test additionally exercises the IO layer (pdf.ts): it builds a
 * real PDF with pdf-lib — coloured filled rectangles for blocks and a legend,
 * positioned text for headers, the time axis and block titles — then runs the
 * full `parseEcampPdf` over the bytes.
 *
 * It is not a Picasso file (the digits are a normal font, so no PUA decoding is
 * exercised here), but it proves that filled-shape colours and positioned words
 * are recovered correctly and flow through the whole parser.
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { beforeAll, describe, expect, it } from 'vitest';
import { parseEcampPdf } from './index';
import type { ParsedProgram } from './types';

const H = 800;
const W = 600;

async function buildEcampLikePdf(): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	doc.setTitle(
		JSON.stringify({ camp: '/camps/fix1', config: 'picasso', periods: ['/periods/pp'] })
	);
	const font = await doc.embedFont(StandardFonts.Helvetica);
	const page = doc.addPage([W, H]);

	const draw = (text: string, x: number, y: number, size = 10) =>
		page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) });
	const rect = (x: number, y: number, w: number, h: number, c: [number, number, number]) =>
		page.drawRectangle({ x, y, width: w, height: h, color: rgb(c[0], c[1], c[2]) });

	const GREY: [number, number, number] = [0.733, 0.733, 0.733];
	const ORANGE: [number, number, number] = [1.0, 0.596, 0.0];
	const BLUE: [number, number, number] = [0.565, 0.718, 0.894];
	const GREEN: [number, number, number] = [0.302, 0.733, 0.322];

	// Legend at the foot.
	rect(20, 15, 10, 10, GREY);
	draw('Essen', 34, 16, 9);
	rect(120, 15, 10, 10, ORANGE);
	draw('Lageraktivitaet', 134, 16, 9);
	rect(220, 15, 10, 10, BLUE);
	draw('Lagerprogramm', 234, 16, 9);
	rect(320, 15, 10, 10, GREEN);
	draw('Lagersport', 334, 16, 9);

	// Time axis on the left (plain digits -> should decode to anchor 07:00).
	draw('07:00', 5, 686, 9);
	draw('08:00', 5, 646, 9);
	draw('09:00', 5, 606, 9);
	draw('10:00', 5, 566, 9);

	// Column headers.
	draw('Mo 14.07.2025', 45, 745);
	draw('Di 15.07.2025', 305, 745);

	// Day 1 column (x 40..260).
	rect(40, 660, 220, 30, GREY); // ES
	draw('Zmorge', 50, 672);
	rect(40, 560, 220, 30, ORANGE); // LA
	draw('Wanderung [Anna]', 50, 572);

	// Day 2 column (x 300..520).
	rect(300, 660, 220, 30, GREY); // ES
	draw('Zmittag', 310, 672);
	rect(300, 560, 220, 30, BLUE); // LP
	draw('Baden im See', 310, 572);

	return doc.save();
}

describe('parseEcampPdf – end to end through pdf.js', () => {
	let program: ParsedProgram;

	beforeAll(async () => {
		const bytes = await buildEcampLikePdf();
		program = await parseEcampPdf(bytes);
	});

	it('reads camp and period metadata from the PDF title', () => {
		expect(program.camp).toBe('/camps/fix1');
		expect(program.periods).toEqual(['/periods/pp']);
	});

	it('learns the legend colours from the document', () => {
		expect(program.legend.some((e) => e.category === 'ES' && e.source === 'legend')).toBe(true);
		expect(program.legend.some((e) => e.category === 'LP' && e.source === 'legend')).toBe(true);
	});

	it('derives two day columns with parsed dates', () => {
		expect(program.days).toHaveLength(2);
		expect(program.days[0].date).toBe('2025-07-14');
		expect(program.days[1].date).toBe('2025-07-15');
	});

	it('decodes the plain-digit time axis anchor', () => {
		expect(program.timeAxis.anchorHour).toBe(7);
		expect(program.timeAxis.anchorSource).toBe('decoded');
		expect(program.timeAxis.hourHeight).toBeCloseTo(40, 0);
	});

	it('classifies blocks by their fill colour and reconstructs titles', () => {
		const day1 = program.days[0];
		const zmorge = day1.blocks.find((b) => b.title.includes('Zmorge'));
		expect(zmorge?.category).toBe('ES');

		const wanderung = day1.blocks.find((b) => b.title.includes('Wanderung'));
		expect(wanderung?.category).toBe('LA');
		expect(wanderung?.responsible).toBe('Anna');

		const baden = program.days[1].blocks.find((b) => b.title.includes('Baden'));
		expect(baden?.category).toBe('LP');
	});

	it('assigns plausible start times to blocks', () => {
		for (const day of program.days) {
			for (const block of day.blocks) {
				expect(block.start).toMatch(/^\d{2}:\d{2}$/);
			}
		}
	});
});
