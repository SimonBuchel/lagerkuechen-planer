/**
 * Plausibility checks shared by both layout analyzers. These never throw: they
 * only push human-readable warnings onto the program so the import assistant can
 * surface them, and provide a numeric score so `parseEcampPdf` can decide
 * whether a layout-fallback produced a better result.
 */

import type { ParsedProgram } from './types';

/** Total recognised blocks across all days — the primary "did it work" signal. */
export function programScore(p: ParsedProgram): number {
	return p.days.reduce((s, d) => s + d.blocks.length, 0);
}

/** A result is plausible when it has days and most of them carry entries. */
export function isPlausible(p: ParsedProgram): boolean {
	if (p.days.length === 0) return false;
	const withBlocks = p.days.filter((d) => d.blocks.length > 0).length;
	return withBlocks >= Math.max(1, Math.ceil(p.days.length * 0.5));
}

/** Appends plausibility warnings (dates, empty days, meals, time axis). */
export function validateProgram(p: ParsedProgram): void {
	if (p.days.length === 0) {
		p.warnings.push('Keine Tagesspalten erkannt – bitte Datei prüfen oder Tage manuell erfassen.');
		return;
	}

	// Empty days.
	p.days.forEach((d, i) => {
		if (d.blocks.length === 0) {
			p.warnings.push(`Tag ${i + 1}${d.date ? ` (${d.date})` : ''} ohne erkannte Einträge.`);
		}
	});

	// Dates: parse, check strictly ascending and consecutive-ish.
	const dated = p.days.map((d) => d.date).filter((x): x is string => !!x);
	for (let i = 1; i < dated.length; i++) {
		if (dated[i] <= dated[i - 1]) {
			p.warnings.push(`Datum nicht aufsteigend: ${dated[i - 1]} → ${dated[i]}.`);
		}
	}
	if (dated.length) {
		const span =
			(Date.parse(dated[dated.length - 1]) - Date.parse(dated[0])) / 86_400_000 + 1;
		if (span > 0 && span > p.days.length + 2) {
			p.warnings.push('Lücke in den Tagesdaten – evtl. fehlt eine Spalte.');
		}
	}

	// Meals: a camp program should contain meals.
	const meals = p.days.reduce((s, d) => s + d.blocks.filter((b) => b.category === 'ES').length, 0);
	if (meals === 0) p.warnings.push('Keine Mahlzeiten (ES) erkannt – bitte prüfen.');

	// Time axis.
	if (p.timeAxis.anchorSource === 'default' || p.timeAxis.hourHeight <= 0) {
		p.warnings.push('Zeitachse unsicher – Startzeiten bitte prüfen.');
	}
}
