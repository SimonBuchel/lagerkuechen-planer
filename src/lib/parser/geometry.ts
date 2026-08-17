/**
 * Geometry analysis: day columns and the vertical time axis.
 *
 * Nothing here reads pixel coordinates from a fixed table — column boundaries
 * and the hour scale are always derived at runtime from the page, so the parser
 * copes with different page formats, column counts and time windows.
 */

import type { FilledRect, PageGeometry, TimeAxisInfo, Word } from './types';

/** A derived day column: an x-range plus the words that make up its header. */
export interface Column {
	x0: number;
	x1: number;
	headerWords: Word[];
}

/**
 * Derives day-column boundaries by clustering the horizontal centres of the
 * activity rectangles. eCamp lays each day out as its own vertical band, so the
 * block centres form tight clusters with clear gaps between columns.
 *
 * @param rects the activity rectangles (legend swatches should be filtered out first)
 * @param opts.minGap minimum horizontal gap (pt) that separates two columns
 */
export function deriveColumns(
	rects: FilledRect[],
	words: Word[],
	opts: { minGap?: number } = {}
): Column[] {
	if (rects.length === 0) return [];
	const minGap = opts.minGap ?? 8;

	// Sort rectangles by left edge and greedily merge overlapping / adjacent
	// x-ranges into column bands.
	const sorted = [...rects].sort((a, b) => a.x0 - b.x0);
	const bands: { x0: number; x1: number }[] = [];
	for (const r of sorted) {
		const last = bands[bands.length - 1];
		if (last && r.x0 <= last.x1 + minGap) {
			last.x1 = Math.max(last.x1, r.x1);
		} else {
			bands.push({ x0: r.x0, x1: r.x1 });
		}
	}

	return bands.map((b) => ({
		x0: b.x0,
		x1: b.x1,
		headerWords: headerWordsFor(words, b.x0, b.x1)
	}));
}

/** Words sitting above the grid within a column's x-range form its header. */
function headerWordsFor(words: Word[], x0: number, x1: number): Word[] {
	const inBand = words.filter((w) => {
		const cx = (w.x0 + w.x1) / 2;
		return cx >= x0 - 4 && cx <= x1 + 4;
	});
	if (inBand.length === 0) return [];
	// The header is the top-most cluster of words in the band.
	const minTop = Math.min(...inBand.map((w) => w.top));
	return inBand.filter((w) => w.top <= minTop + 14).sort((a, b) => a.x0 - b.x0);
}

/**
 * Fits a linear model `top = anchorTop + (hour - anchorHour) * hourHeight` to
 * the time-axis labels on the left edge.
 *
 * The digits of those labels are encoded in a Type-3 subset font we cannot read
 * directly, but the labels are known to be evenly spaced by exactly one hour.
 * So we take the sorted vertical positions of the label rows and use their
 * median spacing as the hour height — robust against a missing or doubled row.
 *
 * @param labelTops vertical centres of the axis label rows, any order
 * @throws if fewer than two labels are supplied (cannot establish a scale)
 */
export function fitHourHeight(labelTops: number[]): { hourHeight: number; topOfFirst: number } {
	if (labelTops.length < 2) {
		throw new Error('need at least two time-axis labels to derive the hour scale');
	}
	const sorted = [...labelTops].sort((a, b) => a - b);
	const gaps: number[] = [];
	for (let i = 1; i < sorted.length; i++) {
		gaps.push(sorted[i] - sorted[i - 1]);
	}
	return { hourHeight: median(gaps), topOfFirst: sorted[0] };
}

function median(values: number[]): number {
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** Default anchor hour used when the PUA digits cannot be decoded (Kapitel 3). */
export const DEFAULT_ANCHOR_HOUR = 7;

/**
 * Three-stage anchor-hour resolution (Kapitel 3.2, step 4):
 *  1. try to decode the PUA digits of the top-most label;
 *  2. otherwise fall back to {@link DEFAULT_ANCHOR_HOUR};
 * The result is always meant to be confirmed by the user in the import wizard,
 * so `source` records how confident we are.
 */
export function resolveAnchorHour(
	topLabelText: string | undefined,
	puaMap?: Map<string, string>
): { anchorHour: number; anchorSource: TimeAxisInfo['anchorSource'] } {
	if (topLabelText && puaMap) {
		const decoded = decodePuaTime(topLabelText, puaMap);
		if (decoded !== null) return { anchorHour: decoded, anchorSource: 'decoded' };
	}
	return { anchorHour: DEFAULT_ANCHOR_HOUR, anchorSource: 'default' };
}

/**
 * Decodes a `HH:MM`-shaped label whose digits are Private-Use-Area codepoints,
 * given a codepoint→digit map. Returns the hour, or null if the label does not
 * resolve to a valid time.
 */
export function decodePuaTime(text: string, puaMap: Map<string, string>): number | null {
	let decoded = '';
	for (const ch of text) {
		if (ch === ':' || ch === '.' || /\d/.test(ch)) {
			decoded += ch;
		} else {
			const mapped = puaMap.get(ch);
			if (mapped === undefined) return null;
			decoded += mapped;
		}
	}
	const m = decoded.match(/^(\d{1,2})[:.](\d{2})$/);
	if (!m) return null;
	const hour = Number(m[1]);
	return hour >= 0 && hour <= 23 ? hour : null;
}

/**
 * Attempts to learn a PUA-codepoint→digit map from the axis labels by
 * exploiting that the labels are a strictly increasing hourly sequence
 * (Kapitel 3.2, step 4: "über die Monotonie der Stundenfolge").
 *
 * Each label is assumed to be `HH:MM` sharing the same `:MM` minutes. We map the
 * distinct leading-hour glyph patterns onto the consecutive integers they must
 * represent. Returns null if the labels are inconsistent with that assumption.
 *
 * @param labelsTopDown axis labels ordered from the top of the page downward
 */
export function learnPuaDigits(labelsTopDown: string[]): Map<string, string> | null {
	if (labelsTopDown.length < 2) return null;

	// Split each label into "hour" and "minute" glyph groups around the separator.
	type Split = { hour: string[]; minute: string[] };
	const splits: Split[] = [];
	for (const label of labelsTopDown) {
		const sepIndex = [...label].findIndex((c) => c === ':' || c === '.');
		if (sepIndex <= 0) return null;
		const chars = [...label];
		splits.push({
			hour: chars.slice(0, sepIndex),
			minute: chars.slice(sepIndex + 1)
		});
	}

	// Consecutive hours: derive the integer each label's hour represents.
	// We only know they increase by one each row; assume the first is unknown but
	// try every plausible start (0..23) and keep the mapping that stays consistent.
	for (let start = 0; start <= 23; start++) {
		const map = new Map<string, string>();
		const usedDigits = new Map<string, string>(); // digit -> glyph, to enforce injectivity
		let ok = true;
		for (let i = 0; i < splits.length && ok; i++) {
			const hourValue = start + i;
			if (hourValue > 23) {
				ok = false;
				break;
			}
			const glyphs = splits[i].hour;
			const digits = String(hourValue).padStart(glyphs.length, '0');
			if (digits.length !== glyphs.length) {
				ok = false;
				break;
			}
			for (let k = 0; k < glyphs.length; k++) {
				const g = glyphs[k];
				const d = digits[k];
				if (/\d/.test(g)) {
					if (g !== d) ok = false;
					continue;
				}
				const existing = map.get(g);
				if (existing !== undefined && existing !== d) {
					ok = false;
					break;
				}
				const glyphForDigit = usedDigits.get(d);
				if (glyphForDigit !== undefined && glyphForDigit !== g) {
					ok = false; // two distinct glyphs cannot mean the same digit
					break;
				}
				map.set(g, d);
				usedDigits.set(d, g);
			}
		}
		if (ok && map.size > 0) return map;
	}
	return null;
}

/** Converts a `top` coordinate to an `"HH:MM"` string using the axis model. */
export function topToTime(top: number, axis: TimeAxisInfo): string {
	const hoursFromAnchor = (top - axis.anchorTop) / axis.hourHeight;
	const totalMinutes = Math.round((axis.anchorHour + hoursFromAnchor) * 60);
	const clamped = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
	const hh = Math.floor(clamped / 60);
	const mm = clamped % 60;
	return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}
