/**
 * Maps eCamp API data (one period) onto the same {@link ParsedProgram} the PDF
 * parsers produce, so everything downstream (Lager, Menüplan, Einkauf, Dossier)
 * works unchanged. Times come straight from eCamp's schedule — minute-exact,
 * no geometry involved.
 *
 * Privacy (Kapitel 8): names of responsible people are **not** imported and
 * e-mail addresses are stripped from titles.
 *
 * Pure function, fully unit-tested.
 */

import type {
	Category,
	LegendEntry,
	ParsedBlock,
	ParsedDay,
	ParsedProgram,
	RGB
} from '../parser/types';
import { stripEmails } from '../parser/text';
import type { EcampActivity, EcampCategory, EcampPeriodData } from './client';

const CATEGORIES: readonly Category[] = ['ES', 'LA', 'LP', 'LS'];
const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

/**
 * eCamp stores times as minute offsets from the period start and serialises
 * them as ISO date-times whose wall-clock part is the camp-local time. We read
 * that wall-clock part verbatim (no timezone conversion), which is exactly what
 * the user typed into eCamp.
 */
export function wallClock(iso: string): { date: string; time: string } | null {
	const m = iso.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})/);
	return m ? { date: m[1], time: `${m[2]}:${m[3]}` } : null;
}

/** `2024-07-06` → `Sa 06.07.2024`, the header style the PDF parsers produce. */
export function headerFor(isoDate: string): string {
	const [y, mo, d] = isoDate.split('-').map(Number);
	const wd = WEEKDAYS[new Date(Date.UTC(y, mo - 1, d)).getUTCDay()];
	return `${wd} ${String(d).padStart(2, '0')}.${String(mo).padStart(2, '0')}.${y}`;
}

function nextDate(isoDate: string): string {
	const [y, mo, d] = isoDate.split('-').map(Number);
	return new Date(Date.UTC(y, mo - 1, d + 1)).toISOString().slice(0, 10);
}

export function hexToRgb(hex: string): RGB | null {
	const m = hex.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
	if (!m) return null;
	let h = m[1];
	if (h.length === 3) h = h.split('').map((c) => c + c).join('');
	return {
		r: parseInt(h.slice(0, 2), 16) / 255,
		g: parseInt(h.slice(2, 4), 16) / 255,
		b: parseInt(h.slice(4, 6), 16) / 255
	};
}

/** eCamp's `short` → our category, or null for anything else (e.g. "HÖ"). */
export function categoryFromShort(short: string | null): Category | null {
	const s = (short ?? '').trim().toUpperCase();
	return (CATEGORIES as readonly string[]).includes(s) ? (s as Category) : null;
}

export function mapPeriodToProgram(data: EcampPeriodData): ParsedProgram {
	const warnings: string[] = [];
	const categoriesByIri = new Map<string, EcampCategory>(data.categories.map((c) => [c.iri, c]));
	const activitiesByIri = new Map<string, EcampActivity>(data.activities.map((a) => [a.iri, a]));

	// Days: the whole period, so days without entries still appear in order.
	const days = new Map<string, ParsedDay>();
	const addDay = (date: string) => {
		if (!days.has(date)) days.set(date, { date, header: headerFor(date), blocks: [] });
		return days.get(date)!;
	};
	const pStart = wallClock(data.period.start)?.date ?? data.period.start.slice(0, 10);
	const pEnd = wallClock(data.period.end)?.date ?? data.period.end.slice(0, 10);
	for (let d = pStart, guard = 0; d <= pEnd && guard < 400; d = nextDate(d), guard++) addDay(d);

	const unknownShorts = new Set<string>();
	let dropped = 0;

	for (const entry of data.scheduleEntries) {
		const start = wallClock(entry.start);
		const end = wallClock(entry.end);
		if (!start) {
			dropped++;
			continue;
		}
		const activity =
			entry.activity ?? (entry.activityIri ? activitiesByIri.get(entry.activityIri) : undefined);
		const category = activity?.categoryIri ? categoriesByIri.get(activity.categoryIri) : undefined;
		const cat = categoryFromShort(category?.short ?? null);
		if (!cat && category?.short) unknownShorts.add(category.short);

		const rawTitle = stripEmails(activity?.title ?? '').replace(/\s+/g, ' ').trim();
		const title = rawTitle || category?.name || '–';

		const block: ParsedBlock = {
			category: cat,
			start: start.time,
			end: end?.time ?? null,
			title,
			responsible: null // never imported (Kapitel 8)
		};
		addDay(start.date).blocks.push(block);
	}

	if (dropped) warnings.push(`${dropped} Programmblock/-blöcke ohne gültige Zeit übersprungen.`);
	for (const s of unknownShorts) {
		warnings.push(`Kategorie «${s}» ist keine Küchen-Kategorie (ES/LA/LP/LS) – bitte zuordnen.`);
	}
	warnings.push('Hinweis: Namen von Verantwortlichen wurden aus Datenschutzgründen nicht übernommen.');

	const legend: LegendEntry[] = data.categories.flatMap((c) => {
		const category = categoryFromShort(c.short);
		const color = c.color ? hexToRgb(c.color) : null;
		return category && color ? [{ color, category, source: 'legend' as const }] : [];
	});

	const orderedDays = [...days.values()]
		.sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
		.map((d) => {
			d.blocks.sort((a, b) => (a.start ?? '').localeCompare(b.start ?? ''));
			return d;
		});

	return {
		layout: 'ecamp-api',
		camp: `/camps/${data.camp.iri.replace(/\/+$/, '').split('/').pop()}`,
		periods: [`/periods/${data.period.id}`],
		days: orderedDays,
		// Times are exact; the axis fields only exist for the PDF wizard.
		timeAxis: { hourHeight: 60, anchorTop: 0, anchorHour: 0, anchorSource: 'decoded' },
		legend,
		warnings
	};
}
