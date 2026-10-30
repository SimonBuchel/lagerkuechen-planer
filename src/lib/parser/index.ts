/**
 * Public API of the eCamp PDF parser.
 *
 * `parseEcampPdf` is the one-call entry point: PDF bytes → typed
 * {@link ParsedProgram}. It supports both known export layouts and picks the
 * right one automatically (the user never chooses):
 *
 *  1. **Picasso** — the graphical daily-grid print (`analyze.ts`).
 *  2. **Grobprogramm** — the PDFKit text export (`grobprogramm.ts`).
 *
 * The layout is detected from several independent signals (`detect.ts`); if the
 * chosen layout yields an implausible result, the other layout is tried and the
 * better of the two is kept. The pure pieces are re-exported so the import
 * wizard and the test-suite can use them directly.
 */

import { analyzePages, type AnalyzeOptions } from './analyze';
import { analyzeGrobprogramm } from './grobprogramm';
import { detectLayout, type Layout } from './detect';
import { isPlausible, programScore, validateProgram } from './validate';
import { loadPageGeometries } from './pdf';
import type { PageGeometry, ParsedProgram } from './types';

export type { AnalyzeOptions } from './analyze';
export * from './types';
export * from './analyze';
export * from './colors';
export * from './geometry';
export * from './text';
export * from './dates';
export * from './metadata';
export * from './detect';
export * from './validate';
export { analyzeGrobprogramm } from './grobprogramm';
export { loadPageGeometries } from './pdf';

function runLayout(layout: Layout, pages: PageGeometry[], opts: AnalyzeOptions): ParsedProgram {
	return layout === 'grobprogramm' ? analyzeGrobprogramm(pages, opts) : analyzePages(pages, opts);
}

/**
 * Parses one eCamp export PDF into a structured program, detecting the layout
 * automatically and falling back to the other layout when needed.
 *
 * @param data the raw PDF bytes
 * @param opts optional analysis tuning / manual corrections from the wizard
 */
export async function parseEcampPdf(
	data: Uint8Array,
	opts: AnalyzeOptions = {}
): Promise<ParsedProgram> {
	const pages = await loadPageGeometries(data);

	const detection = detectLayout(pages);
	const other: Layout = detection.layout === 'grobprogramm' ? 'picasso' : 'grobprogramm';

	let chosen = detection.layout;
	let result = runLayout(detection.layout, pages, opts);

	// Fallback: if the detected layout looks wrong, try the other and keep the
	// better one — so even a misdetection still recovers the data.
	if (!isPlausible(result)) {
		const alt = runLayout(other, pages, opts);
		if (programScore(alt) > programScore(result)) {
			result = alt;
			chosen = other;
			result.warnings.unshift(
				`Layout-Fallback: erkannt als «${detection.layout}», aber «${other}» lieferte verwertbare Daten.`
			);
		}
	}

	result.layout = chosen;
	validateProgram(result);
	return result;
}
