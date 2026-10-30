/**
 * Layout detection for eCamp exports.
 *
 * The user only ever uploads a single file and must never pick a layout. There
 * are two known export shapes per camp, and they are trivially distinguishable
 * by several independent signals (so a single changed detail never flips the
 * result):
 *
 *  **Layout 1 — "Picasso"** (the graphical daily-grid print):
 *   - PDF `Producer` is `Skia/PDF…`.
 *   - PDF `Title` carries the print config `app.ecamp3.ch/print/?config={…"Picasso"…}`.
 *   - The page text starts with the marker `"eCamp v3"`.
 *   - Text is glyph-fragmented (many 1–2 character words).
 *
 *  **Layout 2 — "Grobprogramm"** (the PDFKit text export):
 *   - PDF `Producer` is `PDFKit`.
 *   - No print config in the metadata.
 *   - The page text contains `"Grobprogramm"` and clean day headers
 *     like `"Fr 23.10.2026"` plus margin `HH:MM` time labels.
 *   - Text is whole strings, not fragments.
 *
 * Detection is score-based across all of these so a missing or changed single
 * signal cannot cause a misclassification; `parseEcampPdf` additionally falls
 * back to trying the other layout if the chosen one yields an implausible
 * result, so a wrong guess still recovers.
 */

import type { PageGeometry } from './types';

export type Layout = 'picasso' | 'grobprogramm';

export interface LayoutDetection {
	layout: Layout;
	/** Positive → Picasso, negative → Grobprogramm. Larger magnitude = more confident. */
	score: number;
	/** Human-readable signals that fired, for the import assistant / docs. */
	reasons: string[];
}

const DAY_HEADER = /\b(Mo|Di|Mi|Do|Fr|Sa|So)\s+\d{1,2}\.\d{1,2}\.\d{4}\b/;
const TIME_LABEL = /^\d{1,2}:\d{2}$/;

export function detectLayout(pages: PageGeometry[]): LayoutDetection {
	const reasons: string[] = [];
	let score = 0; // >0 Picasso, <0 Grobprogramm

	const title = pages.find((p) => p.docTitle)?.docTitle ?? '';
	const producer = pages.find((p) => p.docProducer)?.docProducer ?? '';
	const allWords = pages.flatMap((p) => p.words);
	const text = allWords.map((w) => w.text).join(' ');

	// --- Metadata signals (strongest) ---
	if (/picasso/i.test(title) || /ecamp3\.ch\/print/i.test(title)) {
		score += 5;
		reasons.push('Titel enthält die Picasso-Druckkonfiguration');
	}
	if (/^skia/i.test(producer)) {
		score += 3;
		reasons.push(`Producer "${producer}" (Picasso)`);
	}
	if (/pdfkit/i.test(producer)) {
		score -= 4;
		reasons.push(`Producer "${producer}" (Grobprogramm)`);
	}

	// --- Text marker signals ---
	if (/eCamp v3/i.test(text)) {
		score += 3;
		reasons.push('Marker "eCamp v3" gefunden (Picasso)');
	}
	if (/Grobprogramm/i.test(text)) {
		score -= 4;
		reasons.push('Marker "Grobprogramm" gefunden');
	}

	// --- Structural signals ---
	const hasCleanHeaders = allWords.some((w) => DAY_HEADER.test(w.text.trim()));
	if (hasCleanHeaders) {
		score -= 2;
		reasons.push('Saubere Tagesköpfe "Wd dd.mm.yyyy" (Grobprogramm)');
	}
	const marginTimeLabels = pages.some((p) =>
		p.words.filter(
			(w) =>
				TIME_LABEL.test(w.text.trim()) && (w.x0 < p.width * 0.1 || w.x0 > p.width * 0.85)
		).length >= 4
	);
	if (marginTimeLabels) {
		score -= 2;
		reasons.push('Zeit-Labels an beiden Rändern (Grobprogramm)');
	}

	// Glyph fragmentation: Picasso prints letters as separate items.
	const shortWords = allWords.filter((w) => w.text.trim().length > 0 && w.text.trim().length <= 2);
	const fragRatio = allWords.length ? shortWords.length / allWords.length : 0;
	if (fragRatio > 0.5) {
		score += 2;
		reasons.push(`Stark fragmentierter Text (${Math.round(fragRatio * 100)}% kurze Items) → Picasso`);
	}

	return { layout: score >= 0 ? 'picasso' : 'grobprogramm', score, reasons };
}
