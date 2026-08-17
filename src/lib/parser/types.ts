/**
 * Type definitions for the eCamp "Picasso" PDF parser (Phase 1).
 *
 * The parser is split into two layers:
 *  - An IO layer (`pdf.ts`) that turns a PDF into normalized {@link PageGeometry}.
 *  - Pure analysis functions that operate only on {@link PageGeometry} and are
 *    therefore fully unit-testable without any PDF.
 *
 * Coordinate convention across the whole parser: **top-down**. `top` grows
 * downward from the top edge of the page (like pdfplumber), so a smaller `top`
 * means "earlier in the day" on the vertical time axis. The IO layer converts
 * pdf.js' bottom-up coordinates once, so no other module has to think about it.
 */

/** The four eCamp program categories. */
export type Category = 'ES' | 'LA' | 'LP' | 'LS';

/** Human-readable meaning of each category, for UI and debugging. */
export const CATEGORY_LABELS: Record<Category, string> = {
	ES: 'Essen',
	LA: 'Lageraktivität',
	LP: 'Lagerprogramm',
	LS: 'Lagersport'
};

/** An RGB colour with each channel in the range 0..1 (as pdf.js reports them). */
export interface RGB {
	r: number;
	g: number;
	b: number;
}

/** A filled rectangle recovered from the PDF's vector graphics. */
export interface FilledRect {
	x0: number;
	top: number;
	x1: number;
	bottom: number;
	fill: RGB;
}

/** A single positioned word (never split further) from the PDF text layer. */
export interface Word {
	text: string;
	x0: number;
	top: number;
	x1: number;
	bottom: number;
	/** Font name as reported by pdf.js; useful to spot the Type-3 axis font. */
	fontName?: string;
}

/**
 * Everything the pure analysis code needs from one PDF page, already
 * normalized to top-down coordinates. This is the seam that makes the parser
 * testable: tests construct {@link PageGeometry} by hand.
 */
export interface PageGeometry {
	width: number;
	height: number;
	rects: FilledRect[];
	words: Word[];
	/**
	 * The raw string value of the PDF `Title` metadata, if present. eCamp stores
	 * the full print configuration (including camp and period ids) here.
	 */
	docTitle?: string;
}

/** One activity block on the program grid. */
export interface ParsedBlock {
	/** Category derived primarily from fill colour; null if it could not be classified. */
	category: Category | null;
	/** `"HH:MM"` start time derived from geometry, or null if outside the axis. */
	start: string | null;
	/** `"HH:MM"` end time derived from geometry, or null. */
	end: string | null;
	/** Reconstructed activity title (PUA icons stripped, wrapped words rejoined). */
	title: string;
	/** Content that was written in `[...]` in the title, e.g. the responsible person. */
	responsible: string | null;
}

/** One day column of the program. */
export interface ParsedDay {
	/** ISO `yyyy-mm-dd` if it could be parsed, otherwise the raw header text, otherwise null. */
	date: string | null;
	/** Raw header text of the column (weekday + date as printed). */
	header?: string;
	blocks: ParsedBlock[];
}

/** How the vertical time axis was established, surfaced for the import assistant. */
export interface TimeAxisInfo {
	/** Vertical distance in points that corresponds to one hour. */
	hourHeight: number;
	/** `top` coordinate that maps to {@link anchorHour}. */
	anchorTop: number;
	/** The hour (0..23) at {@link anchorTop}. */
	anchorHour: number;
	/** How the anchor hour was determined. */
	anchorSource: 'decoded' | 'default' | 'manual';
}

/** The full parse result for one eCamp export. */
export interface ParsedProgram {
	/** eCamp camp id (e.g. `/camps/abc123`) from the PDF metadata, or null. */
	camp: string | null;
	/** eCamp period ids from the PDF metadata. */
	periods: string[];
	days: ParsedDay[];
	timeAxis: TimeAxisInfo;
	/**
	 * The colour→category mapping actually used, learned from the legend when
	 * possible. Surfaced so the import assistant can show what the parser assumed.
	 */
	legend: LegendEntry[];
	/** Non-fatal problems worth showing the user (missing legend, unknown colour, …). */
	warnings: string[];
}

/** One learned association between a legend swatch colour and a category. */
export interface LegendEntry {
	color: RGB;
	category: Category;
	/** `'legend'` when learned from the document, `'fallback'` for the built-in palette. */
	source: 'legend' | 'fallback';
}
