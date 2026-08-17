/**
 * Parses day-column header dates. Header text extracts cleanly from eCamp (it is
 * a normal font), unlike the time-axis digits.
 *
 * Accepts the common Swiss/German header shapes, e.g. "Mo 14.07.2025",
 * "Montag 14.7.", "14.07.2025", "Mo 14. Juli". When no year is present we cannot
 * form a full ISO date, so we return the raw header and leave `iso` null — the
 * import wizard lets the user fix it.
 */

export interface ParsedDate {
	/** ISO `yyyy-mm-dd`, or null if the year is unknown / unparseable. */
	iso: string | null;
	/** Original header text, always kept for display and manual correction. */
	raw: string;
}

const MONTHS: Record<string, number> = {
	jan: 1,
	januar: 1,
	feb: 2,
	februar: 2,
	mar: 3,
	mär: 3,
	maerz: 3,
	märz: 3,
	apr: 4,
	april: 4,
	mai: 5,
	jun: 6,
	juni: 6,
	jul: 7,
	juli: 7,
	aug: 8,
	august: 8,
	sep: 9,
	sept: 9,
	september: 9,
	okt: 10,
	oktober: 10,
	nov: 11,
	november: 11,
	dez: 12,
	dezember: 12
};

/**
 * @param headerText the raw column-header text
 * @param fallbackYear a year to assume when the header omits it (e.g. from the
 *   camp period); if omitted, headers without a year yield `iso: null`
 */
export function parseHeaderDate(headerText: string, fallbackYear?: number): ParsedDate {
	const raw = headerText.trim();

	// Numeric form: dd.mm(.yyyy)?
	const numeric = raw.match(/(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{2,4})?/);
	if (numeric) {
		const day = Number(numeric[1]);
		const month = Number(numeric[2]);
		const year = normalizeYear(numeric[3], fallbackYear);
		return { iso: toIso(year, month, day), raw };
	}

	// Textual month: "14. Juli 2025" / "14 Juli"
	const textual = raw.match(/(\d{1,2})\.?\s*([A-Za-zäöüÄÖÜ]+)\.?\s*(\d{4})?/);
	if (textual) {
		const day = Number(textual[1]);
		const monthKey = textual[2].toLowerCase();
		const month = MONTHS[monthKey];
		if (month) {
			const year = normalizeYear(textual[3], fallbackYear);
			return { iso: toIso(year, month, day), raw };
		}
	}

	return { iso: null, raw };
}

function normalizeYear(yearStr: string | undefined, fallbackYear?: number): number | null {
	if (yearStr) {
		const n = Number(yearStr);
		if (yearStr.length === 2) return 2000 + n;
		return n;
	}
	return fallbackYear ?? null;
}

function toIso(year: number | null, month: number, day: number): string | null {
	if (year === null) return null;
	if (month < 1 || month > 12 || day < 1 || day > 31) return null;
	return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
