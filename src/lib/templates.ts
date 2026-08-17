/**
 * Alternative import paths for camps that do not use eCamp (Kapitel 3.4):
 * standard camp templates and an empty manual day. These produce the same
 * {@link ParsedProgram} shape the PDF parser returns, so the import wizard can
 * edit them identically.
 */

import type { ParsedBlock, ParsedDay, ParsedProgram, TimeAxisInfo } from './parser/types';

/** The four standard meals of a normal camp day, as editable ES blocks. */
const STANDARD_MEALS: { title: string; start: string; end: string }[] = [
	{ title: 'Zmorge', start: '07:30', end: '08:15' },
	{ title: 'Zmittag', start: '12:00', end: '13:00' },
	{ title: 'Zvieri', start: '15:30', end: '16:00' },
	{ title: 'Znacht', start: '18:30', end: '19:30' }
];

function standardMeals(): ParsedBlock[] {
	return STANDARD_MEALS.map((m) => ({
		category: 'ES',
		start: m.start,
		end: m.end,
		title: m.title,
		responsible: null
	}));
}

const MANUAL_AXIS: TimeAxisInfo = {
	hourHeight: 0,
	anchorTop: 0,
	anchorHour: 7,
	anchorSource: 'manual'
};

/** Adds `days` days to an ISO start date, returning a new ISO date. */
function addDays(startIso: string, days: number): string | null {
	const d = new Date(startIso + 'T00:00:00Z');
	if (Number.isNaN(d.getTime())) return null;
	d.setUTCDate(d.getUTCDate() + days);
	return d.toISOString().slice(0, 10);
}

/**
 * Builds a standard camp template with the given number of days, each carrying
 * the four standard meals. Dates are filled in when a start date is supplied.
 */
export function standardTemplate(dayCount: number, startIso?: string): ParsedProgram {
	const days: ParsedDay[] = [];
	for (let i = 0; i < dayCount; i++) {
		const date = startIso ? addDays(startIso, i) : null;
		days.push({
			date,
			header: date ?? `Tag ${i + 1}`,
			blocks: standardMeals()
		});
	}
	return {
		camp: null,
		periods: [],
		days,
		timeAxis: MANUAL_AXIS,
		legend: [],
		warnings: []
	};
}

/** A single empty day for fully manual entry. */
export function manualDay(dateIso?: string): ParsedDay {
	return {
		date: dateIso ?? null,
		header: dateIso ?? 'Neuer Tag',
		blocks: standardMeals()
	};
}

/** An empty program to start manual entry from. */
export function emptyProgram(): ParsedProgram {
	return {
		camp: null,
		periods: [],
		days: [manualDay()],
		timeAxis: MANUAL_AXIS,
		legend: [],
		warnings: []
	};
}
