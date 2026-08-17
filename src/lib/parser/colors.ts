/**
 * Colour classification and legend learning.
 *
 * The category of an eCamp block is encoded in its fill colour. We never
 * hardcode the mapping as the single source of truth: the primary path learns
 * `colour → category` from the legend printed at the foot of the page, so the
 * parser survives an eCamp theme update. The reference palette below is only a
 * fallback used when the legend is missing or incomplete.
 */

import type { Category, FilledRect, LegendEntry, PageGeometry, RGB, Word } from './types';
import { CATEGORY_LABELS } from './types';

/**
 * Reference palette from the verified sample export (Kapitel 3.1). Used only as
 * a fallback classifier when the legend cannot be learned.
 */
export const REFERENCE_PALETTE: readonly { color: RGB; category: Category }[] = [
	{ color: { r: 0.733, g: 0.733, b: 0.733 }, category: 'ES' }, // grey
	{ color: { r: 1.0, g: 0.596, b: 0.0 }, category: 'LA' }, // orange
	{ color: { r: 0.565, g: 0.718, b: 0.894 }, category: 'LP' }, // blue
	{ color: { r: 0.302, g: 0.733, b: 0.322 }, category: 'LS' } // green
];

/** Squared Euclidean distance between two RGB colours in the unit cube. */
export function colorDistanceSq(a: RGB, b: RGB): number {
	const dr = a.r - b.r;
	const dg = a.g - b.g;
	const db = a.b - b.b;
	return dr * dr + dg * dg + db * db;
}

/**
 * Maps the German legend label (or a bare category code) to a {@link Category}.
 * Diacritics and case are ignored so "Lageraktivität" and "LAGERAKTIVITAET"
 * both match.
 */
export function categoryFromLabel(rawLabel: string): Category | null {
	const label = rawLabel
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '') // strip combining diacritics
		.trim();

	// Bare code prefix, e.g. "ES:" or "la".
	const codeMatch = label.match(/^(es|la|lp|ls)\b/);
	if (codeMatch) return codeMatch[1].toUpperCase() as Category;

	// Match on word stems so "Lageraktivität", "Lageraktivitaet" and
	// "LAGERAKTIVITAT" all resolve regardless of how the umlaut was written.
	if (label.includes('essen')) return 'ES';
	if (label.includes('aktivit')) return 'LA';
	if (label.includes('programm')) return 'LP';
	if (label.includes('sport')) return 'LS';
	return null;
}

/**
 * Learns the colour→category mapping from the legend at the page foot.
 *
 * Strategy: legend swatches are small filled rectangles low on the page, each
 * sitting immediately to the left of its label word. For every candidate
 * swatch we find the nearest label word on roughly the same baseline and to its
 * right, then translate that label to a category.
 *
 * @param page normalized page geometry
 * @param opts tuning knobs (mostly for tests)
 */
export function learnLegend(
	page: PageGeometry,
	opts: {
		/** Only consider swatches/labels below this fraction of the page height. */
		footFraction?: number;
		/** Maximum swatch edge length in points (legend swatches are small). */
		maxSwatchSize?: number;
		/** Vertical tolerance (pt) for pairing a swatch with its label baseline. */
		vTolerance?: number;
	} = {}
): LegendEntry[] {
	const footFraction = opts.footFraction ?? 0.8;
	const maxSwatchSize = opts.maxSwatchSize ?? 20;
	const vTolerance = opts.vTolerance ?? 6;

	const footTop = page.height * footFraction;
	const swatches = page.rects
		.filter((r) => {
			const w = r.x1 - r.x0;
			const h = r.bottom - r.top;
			const centerTop = (r.top + r.bottom) / 2;
			return (
				centerTop >= footTop &&
				w > 1 &&
				h > 1 &&
				w <= maxSwatchSize &&
				h <= maxSwatchSize &&
				!isNearWhite(r.fill)
			);
		})
		.sort((a, b) => a.x0 - b.x0);

	const entries: LegendEntry[] = [];
	const seen = new Set<Category>();

	for (let i = 0; i < swatches.length; i++) {
		const swatch = swatches[i];
		const swatchMidTop = (swatch.top + swatch.bottom) / 2;
		// Read up to the next swatch on the same row, so the whole label is captured.
		const next = swatches
			.slice(i + 1)
			.find((s) => Math.abs((s.top + s.bottom) / 2 - swatchMidTop) <= vTolerance);
		const rightBound = next ? next.x0 - 2 : swatch.x1 + 170;

		const label = reconstructLabelText(page.words, swatch.x1, rightBound, swatchMidTop, vTolerance);
		const category = categoryFromLabel(label);
		if (!category || seen.has(category)) continue;
		seen.add(category);
		entries.push({ color: swatch.fill, category, source: 'legend' });
	}

	return entries;
}

/**
 * Reassembles a legend label from the fragmented word tokens sitting to the
 * right of a swatch, between its right edge and the next swatch. eCamp splits
 * labels into many pieces ("La", "ge", "r", …), so we concatenate every
 * fragment on the swatch's baseline in reading order.
 */
function reconstructLabelText(
	words: Word[],
	swatchRight: number,
	rightBound: number,
	swatchMidTop: number,
	vTolerance: number
): string {
	return words
		.filter((w) => {
			const midTop = (w.top + w.bottom) / 2;
			return (
				Math.abs(midTop - swatchMidTop) <= vTolerance &&
				w.x0 >= swatchRight - 2 &&
				w.x0 <= rightBound
			);
		})
		.sort((a, b) => a.x0 - b.x0)
		.map((w) => w.text)
		.join('')
		.replace(/\s+/g, ' ')
		.trim();
}

function isNearWhite(c: RGB): boolean {
	return c.r > 0.95 && c.g > 0.95 && c.b > 0.95;
}

/**
 * A classifier that turns a fill colour into a category, using the learned
 * legend first and the reference palette as a fallback. Colours farther than
 * `tolerance` (Euclidean, unit cube) from every known colour classify as null.
 */
export interface ColorClassifier {
	classify(color: RGB): Category | null;
	/** The mapping the classifier is built on, for surfacing to the user. */
	entries: LegendEntry[];
}

export function buildColorClassifier(
	learned: LegendEntry[],
	opts: { tolerance?: number; includeFallback?: boolean } = {}
): ColorClassifier {
	const tolerance = opts.tolerance ?? 0.15;
	const toleranceSq = tolerance * tolerance;

	const entries: LegendEntry[] = [...learned];
	if (opts.includeFallback ?? true) {
		const covered = new Set(learned.map((e) => e.category));
		for (const ref of REFERENCE_PALETTE) {
			if (!covered.has(ref.category)) {
				entries.push({ color: ref.color, category: ref.category, source: 'fallback' });
			}
		}
	}

	return {
		entries,
		classify(color: RGB): Category | null {
			let best: Category | null = null;
			let bestDist = Infinity;
			for (const e of entries) {
				const d = colorDistanceSq(color, e.color);
				if (d < bestDist) {
					bestDist = d;
					best = e.category;
				}
			}
			return bestDist <= toleranceSq ? best : null;
		}
	};
}

/** Convenience: the label for a category (used by UI/debug output). */
export function labelForCategory(category: Category): string {
	return CATEGORY_LABELS[category];
}
