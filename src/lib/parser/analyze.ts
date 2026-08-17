/**
 * Pure analysis pipeline: normalized {@link PageGeometry} pages → {@link ParsedProgram}.
 *
 * This module contains no IO. Everything it needs from the PDF has already been
 * reduced to rectangles and words by `pdf.ts`, which makes the whole grid
 * reconstruction unit-testable with hand-built fixtures.
 */

import { buildColorClassifier, learnLegend, type ColorClassifier } from './colors';
import { parseHeaderDate } from './dates';
import {
	deriveColumns,
	fitHourHeight,
	learnPuaDigits,
	resolveAnchorHour,
	topToTime,
	type Column
} from './geometry';
import { parseTitleMetadata } from './metadata';
import { reconstructBlockText } from './text';
import type {
	Category,
	FilledRect,
	LegendEntry,
	PageGeometry,
	ParsedBlock,
	ParsedDay,
	ParsedProgram,
	TimeAxisInfo,
	Word
} from './types';

export interface AnalyzeOptions {
	/** Year to assume for headers that omit it (e.g. derived from the camp period). */
	fallbackYear?: number;
	/** Colour distance tolerance for classification. */
	colorTolerance?: number;
	/** Override the anchor hour (manual correction from the wizard). */
	manualAnchorHour?: number;
}

/** Analyzes a single already-normalized page. Multi-page merge happens in {@link analyzePages}. */
export function analyzePage(
	page: PageGeometry,
	opts: AnalyzeOptions = {}
): {
	day: ParsedDay[];
	timeAxis: TimeAxisInfo;
	legend: LegendEntry[];
	warnings: string[];
} {
	const warnings: string[] = [];

	// 1. Learn the legend, build the colour classifier.
	const learned = learnLegend(page);
	if (learned.length === 0) {
		warnings.push('Keine Legende erkannt – Standard-Farbpalette verwendet.');
	}
	const classifier = buildColorClassifier(learned, { tolerance: opts.colorTolerance });

	// 2. Derive day columns from the regular grid (all rectangles inform it).
	const columns = deriveColumns(page.rects, page.words);
	if (columns.length === 0) {
		warnings.push('Keine Tagesspalten erkannt – leere oder unerwartete Seite.');
	}
	// The day-cell width equals a column's width; grid/header cells share it and
	// must not be mistaken for activity blocks.
	const cellWidth = columns.length ? columns[0].x1 - columns[0].x0 : 0;

	// 3. Separate legend swatches, background and grid cells from activity blocks.
	// A cell-width rectangle is background only where it is part of a regular
	// stack (the empty hour grid has many per column); a lone full-width coloured
	// block is kept.
	const isCellWidth = (r: FilledRect) => cellWidth > 0 && Math.abs(r.x1 - r.x0 - cellWidth) <= 4;
	const cellWidthPerColumn = columns.map(
		(col) => page.rects.filter((r) => isCellWidth(r) && rectInColumn(r, col)).length
	);
	const isBackgroundGridCell = (r: FilledRect) => {
		if (!isCellWidth(r)) return false;
		const ci = columns.findIndex((col) => rectInColumn(r, col));
		return ci >= 0 && cellWidthPerColumn[ci] >= 3;
	};

	const swatchSet = new Set(collectSwatches(page));
	const activityRects = page.rects.filter(
		(r) =>
			!swatchSet.has(r) && !isBackground(r, page) && isBlockSized(r) && !isBackgroundGridCell(r)
	);

	// 4. Establish the time axis from the left-hand labels.
	const timeAxis = buildTimeAxis(page, columns, opts, warnings);

	// 5. Assign every word to at most one block, so overlapping (parallel) blocks
	// never both claim the same text.
	const blockWords = assignWordsToBlocks(activityRects, page.words);

	// 6. Build blocks per column.
	const days: ParsedDay[] = columns.map((col) =>
		buildDay(col, activityRects, blockWords, page.words, classifier, timeAxis, opts, warnings)
	);

	return { day: days, timeAxis, legend: classifier.entries, warnings };
}

/** Analyzes and merges all pages of one export into a single program. */
export function analyzePages(pages: PageGeometry[], opts: AnalyzeOptions = {}): ParsedProgram {
	const warnings: string[] = [];
	const meta = parseTitleMetadata(pages.find((p) => p.docTitle)?.docTitle);

	let timeAxis: TimeAxisInfo | null = null;
	let legend: LegendEntry[] = [];
	const byDate = new Map<string, ParsedDay>();
	const dedupe = new Set<string>();
	let orderCounter = 0;
	const order = new Map<string, number>();

	for (const page of pages) {
		const res = analyzePage(page, opts);
		warnings.push(...res.warnings);
		if (!timeAxis) timeAxis = res.timeAxis;
		if (legend.length === 0) legend = res.legend;

		for (const day of res.day) {
			const key = day.date ?? day.header ?? `spalte-${orderCounter++}`;
			if (!order.has(key)) order.set(key, orderCounter++);
			const existing = byDate.get(key);
			const target = existing ?? { date: day.date, header: day.header, blocks: [] };
			for (const block of day.blocks) {
				// Deduplicate identical blocks across overlapping pages.
				const blockKey = `${key}|${block.start}|${block.title}`;
				if (dedupe.has(blockKey)) continue;
				dedupe.add(blockKey);
				target.blocks.push(block);
			}
			byDate.set(key, target);
		}
	}

	const days = [...byDate.entries()]
		.sort((a, b) => (order.get(a[0]) ?? 0) - (order.get(b[0]) ?? 0))
		.map(([, day]) => {
			day.blocks.sort((a, b) => (a.start ?? '').localeCompare(b.start ?? ''));
			return day;
		});

	return {
		camp: meta.camp,
		periods: meta.periods,
		days,
		timeAxis: timeAxis ?? {
			hourHeight: 0,
			anchorTop: 0,
			anchorHour: 7,
			anchorSource: 'default'
		},
		legend,
		warnings
	};
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

/** Small coloured rectangles low on the page: legend swatches (also used for learning). */
function collectSwatches(page: PageGeometry): FilledRect[] {
	const footTop = page.height * 0.8;
	return page.rects.filter((r) => {
		const w = r.x1 - r.x0;
		const h = r.bottom - r.top;
		const centerTop = (r.top + r.bottom) / 2;
		return centerTop >= footTop && w > 1 && h > 1 && w <= 20 && h <= 20;
	});
}

/** A rectangle covering most of the page is a background/border, not a block. */
function isBackground(r: FilledRect, page: PageGeometry): boolean {
	const w = r.x1 - r.x0;
	const h = r.bottom - r.top;
	return w >= page.width * 0.85 && h >= page.height * 0.6;
}

/** Blocks are wider than a legend swatch and tall enough to hold text. */
function isBlockSized(r: FilledRect): boolean {
	const w = r.x1 - r.x0;
	const h = r.bottom - r.top;
	return w >= 20 && h >= 5;
}

/** Builds the time-axis model from the label rows left of the first column. */
function buildTimeAxis(
	page: PageGeometry,
	columns: Column[],
	opts: AnalyzeOptions,
	warnings: string[]
): TimeAxisInfo {
	const firstColX0 = columns.length ? Math.min(...columns.map((c) => c.x0)) : page.width;
	const axisWords = page.words.filter((w) => w.x1 <= firstColX0 - 2 && looksLikeTimeLabel(w.text));
	const rows = clusterRows(axisWords);

	if (rows.length < 2) {
		warnings.push('Zeitachse konnte nicht sicher bestimmt werden – bitte Startzeit prüfen.');
		return {
			hourHeight: 20.25, // sample-export default; user confirms in the wizard
			anchorTop: rows[0]?.top ?? 0,
			anchorHour: opts.manualAnchorHour ?? 7,
			anchorSource: opts.manualAnchorHour !== undefined ? 'manual' : 'default'
		};
	}

	const { hourHeight, topOfFirst } = fitHourHeight(rows.map((r) => r.top));
	const labelsTopDown = rows.map((r) => r.text);

	let anchorHour: number;
	let anchorSource: TimeAxisInfo['anchorSource'];
	if (opts.manualAnchorHour !== undefined) {
		anchorHour = opts.manualAnchorHour;
		anchorSource = 'manual';
	} else {
		const puaMap = learnPuaDigits(labelsTopDown) ?? undefined;
		const resolved = resolveAnchorHour(labelsTopDown[0], puaMap);
		anchorHour = resolved.anchorHour;
		anchorSource = resolved.anchorSource;
		if (anchorSource === 'default') {
			warnings.push(
				'Ankerstunde nicht dekodierbar – Standard 07:00 angenommen (bitte bestätigen).'
			);
		}
	}

	return { hourHeight, anchorTop: topOfFirst, anchorHour, anchorSource };
}

/** A time label is short and made of digits, a separator and/or PUA glyphs. */
function looksLikeTimeLabel(text: string): boolean {
	const t = text.trim();
	if (t.length === 0 || t.length > 6) return false;
	return /[:.]/.test(t) || /[-]/.test(t) || /^\d{1,2}$/.test(t);
}

/** Clusters words into rows by `top`, returning one representative per row. */
function clusterRows(words: Word[], tolerance = 3): { top: number; text: string }[] {
	if (words.length === 0) return [];
	const sorted = [...words].sort((a, b) => a.top - b.top || a.x0 - b.x0);
	const rows: { top: number; text: string }[] = [];
	let bucket: Word[] = [sorted[0]];
	let bucketTop = sorted[0].top;
	const flush = () => {
		bucket.sort((a, b) => a.x0 - b.x0);
		const top = bucket.reduce((s, w) => s + (w.top + w.bottom) / 2, 0) / bucket.length;
		rows.push({ top, text: bucket.map((w) => w.text).join('') });
	};
	for (let i = 1; i < sorted.length; i++) {
		if (Math.abs(sorted[i].top - bucketTop) <= tolerance) {
			bucket.push(sorted[i]);
		} else {
			flush();
			bucket = [sorted[i]];
			bucketTop = sorted[i].top;
		}
	}
	flush();
	return rows;
}

/**
 * Assigns each word to at most one block. A word is placed in the block that
 * starts nearest above it (text is anchored to the top of its block); this stops
 * two vertically overlapping blocks from both claiming the same word.
 */
function assignWordsToBlocks(rects: FilledRect[], words: Word[]): Map<FilledRect, Word[]> {
	const map = new Map<FilledRect, Word[]>();
	for (const r of rects) map.set(r, []);

	const area = (r: FilledRect) => (r.x1 - r.x0) * (r.bottom - r.top);
	const centerTop = (r: FilledRect) => (r.top + r.bottom) / 2;

	for (const w of words) {
		const containers = rects.filter((r) => wordCenterInRect(w, r));
		if (containers.length === 0) continue;

		const above = containers.filter((r) => r.top <= w.top + 1);
		let best: FilledRect;
		if (above.length) {
			best = above.reduce((a, b) => {
				const da = w.top - a.top;
				const db = w.top - b.top;
				if (db !== da) return db < da ? b : a;
				return area(b) < area(a) ? b : a;
			});
		} else {
			best = containers.reduce((a, b) => {
				const da = Math.abs(centerTop(a) - w.top);
				const db = Math.abs(centerTop(b) - w.top);
				if (db !== da) return db < da ? b : a;
				return area(b) < area(a) ? b : a;
			});
		}
		map.get(best)!.push(w);
	}
	return map;
}

/** Builds one day column: header date + its blocks. */
function buildDay(
	col: Column,
	activityRects: FilledRect[],
	blockWords: Map<FilledRect, Word[]>,
	words: Word[],
	classifier: ColorClassifier,
	timeAxis: TimeAxisInfo,
	opts: AnalyzeOptions,
	warnings: string[]
): ParsedDay {
	// The date is a clean single token in the column header (e.g. "22.05.2026");
	// take the top-most one whose horizontal centre falls inside this column.
	const dateToken = words
		.filter((w) => DATE_RE.test(w.text) && centerXInColumn(w, col))
		.sort((a, b) => a.top - b.top)[0];
	const headerText = dateToken
		? dateToken.text
		: col.headerWords
				.map((w) => w.text)
				.join('')
				.trim();
	const parsedDate = parseHeaderDate(headerText, opts.fallbackYear);

	const colRects = activityRects.filter((r) => rectInColumn(r, col)).sort((a, b) => a.top - b.top);

	const blocks: ParsedBlock[] = colRects.map((rect) => {
		const inside = blockWords.get(rect) ?? [];
		const text = reconstructBlockText(inside);
		let category: Category | null = classifier.classify(rect.fill);
		if (category === null && text.prefixCode) {
			category = text.prefixCode;
			warnings.push(
				`Unbekannte Blockfarbe – Kategorie aus Präfix "${text.prefixCode}" übernommen.`
			);
		} else if (category === null) {
			warnings.push('Block mit unbekannter Farbe ohne Kategorie-Präfix erkannt.');
		}
		return {
			category,
			start: timeAxis.hourHeight > 0 ? topToTime(rect.top, timeAxis) : null,
			end: timeAxis.hourHeight > 0 ? topToTime(rect.bottom, timeAxis) : null,
			title: text.title,
			responsible: text.responsible
		};
	});

	return { date: parsedDate.iso, header: parsedDate.raw || undefined, blocks };
}

/** A day/month(/year) date token as printed in a column header. */
const DATE_RE = /\d{1,2}\.\d{1,2}\.\d{2,4}/;

function centerXInColumn(w: Word, col: Column): boolean {
	const cx = (w.x0 + w.x1) / 2;
	return cx >= col.x0 - 2 && cx <= col.x1 + 2;
}

function rectInColumn(r: FilledRect, col: Column): boolean {
	const cx = (r.x0 + r.x1) / 2;
	return cx >= col.x0 - 2 && cx <= col.x1 + 2;
}

function wordCenterInRect(w: Word, r: FilledRect): boolean {
	const cx = (w.x0 + w.x1) / 2;
	const cy = (w.top + w.bottom) / 2;
	return cx >= r.x0 - 1 && cx <= r.x1 + 1 && cy >= r.top - 1 && cy <= r.bottom + 1;
}
