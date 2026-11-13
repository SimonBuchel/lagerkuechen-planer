import { describe, expect, it } from 'vitest';
import { categoryFromShort, headerFor, hexToRgb, mapPeriodToProgram, wallClock } from './map';
import type { EcampPeriodData } from './client';

function sample(): EcampPeriodData {
	return {
		camp: { iri: '/api/camps/c1', name: 'SoLa', title: 'Sommerlager 2024' },
		period: {
			id: 'p1',
			iri: '/api/periods/p1',
			description: 'Hauptlager',
			start: '2024-07-06',
			end: '2024-07-08'
		},
		categories: [
			{ iri: '/api/categories/es', short: 'ES', name: 'Essen', color: '#9E9E9E' },
			{ iri: '/api/categories/lp', short: 'LP', name: 'Lagerprogramm', color: '#90B7E4' },
			{ iri: '/api/categories/hoe', short: 'HÖ', name: 'Höck', color: '#F44336' }
		],
		activities: [
			{ iri: '/api/activities/a1', title: 'Besammlung', categoryIri: '/api/categories/lp' },
			{ iri: '/api/activities/a2', title: 'Zmorge kontakt@example.ch', categoryIri: '/api/categories/es' },
			{ iri: '/api/activities/a3', title: 'Leiterhöck', categoryIri: '/api/categories/hoe' }
		],
		scheduleEntries: [
			// Stored offsets → serialised with a timezone we must NOT convert.
			{ iri: '/api/schedule_entries/s1', start: '2024-07-06T08:30:00+00:00', end: '2024-07-06T09:00:00+00:00', activityIri: '/api/activities/a1' },
			{ iri: '/api/schedule_entries/s2', start: '2024-07-07T07:30:00+00:00', end: '2024-07-07T08:15:00+00:00', activityIri: '/api/activities/a2' },
			// Embedded activity instead of an IRI, and a cross-midnight end.
			{
				iri: '/api/schedule_entries/s3',
				start: '2024-07-07T22:00:00+00:00',
				end: '2024-07-08T00:30:00+00:00',
				activityIri: null,
				activity: { iri: '/api/activities/a3', title: 'Leiterhöck', categoryIri: '/api/categories/hoe' }
			}
		]
	};
}

describe('wallClock / headerFor / hexToRgb / categoryFromShort', () => {
	it('reads the wall-clock part verbatim, ignoring the timezone suffix', () => {
		expect(wallClock('2024-07-06T08:30:00+02:00')).toEqual({ date: '2024-07-06', time: '08:30' });
		expect(wallClock('nope')).toBeNull();
	});
	it('formats headers like the PDF parsers', () => {
		expect(headerFor('2024-07-06')).toBe('Sa 06.07.2024');
	});
	it('parses hex colours', () => {
		expect(hexToRgb('#FFF')).toEqual({ r: 1, g: 1, b: 1 });
		expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
		expect(hexToRgb('red')).toBeNull();
	});
	it('maps only the four kitchen categories', () => {
		expect(categoryFromShort('es')).toBe('ES');
		expect(categoryFromShort('HÖ')).toBeNull();
		expect(categoryFromShort(null)).toBeNull();
	});
});

describe('mapPeriodToProgram', () => {
	const prog = mapPeriodToProgram(sample());

	it('creates one day per period date, in order, with PDF-style headers', () => {
		expect(prog.days.map((d) => d.date)).toEqual(['2024-07-06', '2024-07-07', '2024-07-08']);
		expect(prog.days[0].header).toBe('Sa 06.07.2024');
		expect(prog.layout).toBe('ecamp-api');
		expect(prog.camp).toBe('/camps/c1');
		expect(prog.periods).toEqual(['/periods/p1']);
	});

	it('takes exact times from the schedule and the category from the short name', () => {
		const sat = prog.days[0].blocks;
		expect(sat).toEqual([
			{ category: 'LP', start: '08:30', end: '09:00', title: 'Besammlung', responsible: null }
		]);
		const sun = prog.days[1].blocks;
		expect(sun[0]).toMatchObject({ category: 'ES', start: '07:30', end: '08:15', title: 'Zmorge' });
	});

	it('strips e-mails, never imports names, and keeps unknown categories as null with a warning', () => {
		const sun = prog.days[1].blocks;
		expect(sun[0].title).not.toContain('@');
		expect(sun.every((b) => b.responsible === null)).toBe(true);
		const hoeck = sun.find((b) => b.title === 'Leiterhöck');
		expect(hoeck?.category).toBeNull();
		expect(hoeck?.start).toBe('22:00');
		expect(prog.warnings.some((w) => w.includes('«HÖ»'))).toBe(true);
	});

	it('builds a legend from the mappable categories', () => {
		expect(prog.legend.map((l) => l.category).sort()).toEqual(['ES', 'LP']);
		expect(prog.legend.every((l) => l.source === 'legend')).toBe(true);
	});
});
