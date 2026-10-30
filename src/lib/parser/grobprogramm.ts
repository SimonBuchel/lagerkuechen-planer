/**
 * Analyzer for the eCamp **"Grobprogramm"** export (Layout 2).
 *
 * This is a completely different PDF than the graphical "Picasso" print that
 * `analyze.ts` handles. It is produced by PDFKit (not Skia), carries no print
 * config in its metadata, and — crucially — writes **clean whole-string text**:
 *
 *  - day headers as `"Fr 23.10.2026"` (weekday + date in one text item),
 *  - the vertical time axis as plain `"HH:MM"` labels in both margins,
 *  - activities as `"ES Essen"`, `"LP 2.1 Morge Tanz"`, `"LS 3.1 Staffette"` —
 *    the category (ES/LA/LP/LS) is the text prefix, not just a fill colour.
 *
 * Because everything we need is in the text layer, this analyzer never touches
 * fill colours: the category comes from the prefix and the start time is read
 * straight off the margin axis (no colour legend, no regression, no anchor-hour
 * guessing). That makes it the more reliable of the two layouts.
 *
 * Pure function over {@link PageGeometry}, so it is fully unit-testable.
 */

import { parseHeaderDate } from './dates';
import type {
	Category,
	ParsedBlock,
	ParsedDay,
	ParsedProgram,
	PageGeometry,
	TimeAxisInfo,
	Word
} from './types';
import type { AnalyzeOptions } from './analyze';

const DAY_HEADER = /^(Mo|Di|Mi|Do|Fr|Sa|So)\s+(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
const TIME_LABEL = /^(\d{1,2}):(\d{2})$/;
const CATEGORY = /^(ES|LA|LP|LS)\b\s*(.*)$/;
const LEADING_NUMBER = /^\d+(?:\.\d+)*\s+/;
const TWO_LETTER_CODE = /^[A-Z]{2}$/;

const CATEGORIES: readonly Category[] = ['ES', 'LA', 'LP', 'LS'];

interface DayColumn {
	date: string | null;
	header: string;
	/** Left-edge x of the header, used as the column reference. */
	x: number;
}

/** Linear map from a top coordinate to minutes-since-midnight for one page. */
interface PageAxis {
	pxPerMinute: number;
	anchorTop: number;
	anchorMinutes: number;
}

const cx = (w: Word) => w.x0;
const cy = (w: Word) => (w.top + w.bottom) / 2;

function pad2(n: number): string {
	return String(n).padStart(2, '0');
}

function minutesToHHMM(min: number): string {
	const m = ((Math.round(min) % 1440) + 1440) % 1440;
	return `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
}

/** Day headers on a page, left→right. */
function findColumns(page: PageGeometry, opts: AnalyzeOptions): DayColumn[] {
	const cols: DayColumn[] = [];
	for (const w of page.words) {
		const m = w.text.trim().match(DAY_HEADER);
		if (!m) continue;
		const parsed = parseHeaderDate(w.text.trim(), opts.fallbackYear);
		cols.push({ date: parsed.iso, header: w.text.trim(), x: w.x0 });
	}
	cols.sort((a, b) => a.x - b.x);
	return cols;
}

/** Midpoint boundaries between adjacent columns; returns the day index for an x. */
function makeColumnIndexer(cols: DayColumn[]): (x: number) => number {
	const bounds: number[] = [];
	for (let i = 0; i < cols.length - 1; i++) bounds.push((cols[i].x + cols[i + 1].x) / 2);
	return (x: number) => {
		let i = 0;
		while (i < bounds.length && x >= bounds[i]) i++;
		return i;
	};
}

/**
 * Builds the time axis from the margin `HH:MM` labels. Robust against the odd
 * frame label that is not on the hourly grid: the slope is the *median* of the
 * per-pair slopes, so a single outlier pair cannot distort it. Midnight wrap
 * (00:00 reappearing below 23:00) is unwrapped to +24h.
 */
function buildPageAxis(page: PageGeometry, warnings: string[]): PageAxis | null {
	const leftMax = page.width * 0.1;
	const rightMin = page.width * 0.9;
	const labels = page.words
		.map((w) => {
			const m = w.text.trim().match(TIME_LABEL);
			if (!m) return null;
			if (cx(w) > leftMax && cx(w) < rightMin) return null; // only margin labels
			const h = Number(m[1]);
			const mm = Number(m[2]);
			if (h > 24 || mm > 59) return null;
			return { top: cy(w), minutes: h * 60 + mm };
		})
		.filter((v): v is { top: number; minutes: number } => v !== null);

	if (labels.length < 3) {
		warnings.push('Grobprogramm: zu wenige Zeit-Markierungen – Startzeiten unsicher.');
		return null;
	}

	// Keep one label per distinct top (both margins repeat each hour).
	const byTop = new Map<number, number>();
	for (const l of labels) {
		const key = Math.round(l.top);
		if (!byTop.has(key)) byTop.set(key, l.minutes);
	}
	const uniq = [...byTop.entries()]
		.map(([top, minutes]) => ({ top, minutes }))
		.sort((a, b) => a.top - b.top);

	// Unwrap midnight so minutes increase monotonically with top.
	let offset = 0;
	let prev = -Infinity;
	const pts = uniq.map((p) => {
		let abs = p.minutes + offset;
		while (abs <= prev) {
			offset += 1440;
			abs = p.minutes + offset;
		}
		prev = abs;
		return { top: p.top, abs };
	});

	// Median of adjacent slopes (px per minute).
	const slopes: number[] = [];
	for (let i = 0; i < pts.length - 1; i++) {
		const dm = pts[i + 1].abs - pts[i].abs;
		const dt = pts[i + 1].top - pts[i].top;
		if (dm > 0 && dt > 0) slopes.push(dt / dm);
	}
	if (slopes.length === 0) return null;
	slopes.sort((a, b) => a - b);
	const pxPerMinute = slopes[Math.floor(slopes.length / 2)];
	if (!(pxPerMinute > 0)) return null;

	// Anchor on the median label (inside the consistent run).
	const mid = pts[Math.floor(pts.length / 2)];
	return { pxPerMinute, anchorTop: mid.top, anchorMinutes: mid.abs };
}

function topToMinutes(axis: PageAxis, top: number): number {
	return axis.anchorMinutes + (top - axis.anchorTop) / axis.pxPerMinute;
}

/** Is this word a non-activity label (header, time, responsible code, legend/footer)? */
function isNoise(w: Word, page: PageGeometry): boolean {
	const t = w.text.trim();
	if (!t) return true;
	if (DAY_HEADER.test(t)) return true;
	if (TIME_LABEL.test(t)) return true;
	if (TWO_LETTER_CODE.test(t) && !CATEGORIES.includes(t as Category)) return true; // responsible initials
	if (/^Tagesverantwortliche/i.test(t)) return true;
	if (/^Grobprogramm/i.test(t)) return true;
	// Footer / legend band (bottom ~18% of the page).
	if (cy(w) > page.height * 0.82) return true;
	return false;
}

/** Splits `"LP 2.1 Morge Tanz"` into category + clean title. */
function parseActivity(text: string): { category: Category; title: string } | null {
	const m = text.trim().match(CATEGORY);
	if (!m) return null;
	const category = m[1] as Category;
	const title = m[2].replace(LEADING_NUMBER, '').trim();
	return { category, title };
}

function analyzeGrobprogrammPage(
	page: PageGeometry,
	opts: AnalyzeOptions,
	warnings: string[]
): { days: ParsedDay[]; axis: PageAxis | null } {
	const cols = findColumns(page, opts);
	if (cols.length === 0) return { days: [], axis: null };
	const columnOf = makeColumnIndexer(cols);
	const axis = buildPageAxis(page, warnings);

	const days: ParsedDay[] = cols.map((c) => ({ date: c.date, header: c.header, blocks: [] }));

	// Candidate activity words, sorted top-down then left-right.
	const candidates = page.words
		.filter((w) => !isNoise(w, page))
		.slice()
		.sort((a, b) => cy(a) - cy(b) || cx(a) - cx(b));

	let last: { block: ParsedBlock; x: number; top: number } | null = null;

	for (const w of candidates) {
		const act = parseActivity(w.text);
		if (!act) {
			// Possible wrapped continuation of the previous activity title.
			if (
				last &&
				Math.abs(cx(w) - last.x) <= 22 &&
				cy(w) - last.top > 0 &&
				cy(w) - last.top <= 16
			) {
				const joiner = last.block.title.endsWith('-') ? '' : ' ';
				last.block.title = (last.block.title.replace(/-$/, '') + joiner + w.text.trim()).trim();
				last.top = cy(w);
			}
			continue;
		}
		const dayIdx = columnOf(cx(w));
		if (dayIdx < 0 || dayIdx >= days.length) continue;
		const start = axis ? minutesToHHMM(topToMinutes(axis, cy(w))) : null;
		const block: ParsedBlock = {
			category: act.category,
			start,
			end: null,
			title: act.title,
			responsible: null
		};
		days[dayIdx].blocks.push(block);
		last = { block, x: cx(w), top: cy(w) };
	}

	return { days, axis };
}

/**
 * Parses a Grobprogramm export (one or more pages) into a {@link ParsedProgram}.
 */
export function analyzeGrobprogramm(
	pages: PageGeometry[],
	opts: AnalyzeOptions = {}
): ParsedProgram {
	const warnings: string[] = [];
	const byDate = new Map<string, ParsedDay>();
	const order = new Map<string, number>();
	let counter = 0;
	let firstAxis: PageAxis | null = null;

	for (const page of pages) {
		const { days, axis } = analyzeGrobprogrammPage(page, opts, warnings);
		if (!firstAxis && axis) firstAxis = axis;
		for (const day of days) {
			const key = day.date ?? day.header ?? `spalte-${counter}`;
			if (!order.has(key)) order.set(key, counter++);
			const target = byDate.get(key) ?? { date: day.date, header: day.header, blocks: [] };
			for (const block of day.blocks) {
				const bk = `${block.start}|${block.category}|${block.title}`;
				if (target.blocks.some((b) => `${b.start}|${b.category}|${b.title}` === bk)) continue;
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

	// Camp-type hint from the footer ("Haus"/"Zelt"), surfaced as info.
	const footer = pages
		.flatMap((p) => p.words.filter((w) => cy(w) > p.height * 0.86).map((w) => w.text.trim()))
		.join(' ');
	if (/\bZelt\b/i.test(footer)) warnings.push('Hinweis: Zeltlager erkannt (laut Export).');
	else if (/\bHaus\b/i.test(footer)) warnings.push('Hinweis: Hauslager erkannt (laut Export).');

	const timeAxis: TimeAxisInfo = firstAxis
		? {
				hourHeight: firstAxis.pxPerMinute * 60,
				anchorTop: firstAxis.anchorTop,
				anchorHour: (((Math.round(firstAxis.anchorMinutes / 60) % 24) + 24) % 24),
				anchorSource: 'decoded'
			}
		: { hourHeight: 0, anchorTop: 0, anchorHour: 7, anchorSource: 'default' };

	return { camp: null, periods: [], days, timeAxis, legend: [], warnings };
}
