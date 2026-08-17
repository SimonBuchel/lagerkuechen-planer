import { describe, expect, it } from 'vitest';
import { evaluateDay, toProgramDays } from './engine';
import type { ProgramBlock, ProgramDay } from './types';

function day(blocks: ProgramBlock[], over: Partial<ProgramDay> = {}): ProgramDay {
	return { date: null, index: 0, isFirst: false, isLast: false, blocks, ...over };
}

const b = (
	category: ProgramBlock['category'],
	title: string,
	start: string,
	end: string
): ProgramBlock => ({
	category,
	title,
	start,
	end
});

describe('toProgramDays', () => {
	it('marks first and last day', () => {
		const days = toProgramDays([
			{ date: '2026-07-12', blocks: [] },
			{ date: '2026-07-13', blocks: [] },
			{ date: '2026-07-14', blocks: [] }
		]);
		expect(days[0].isFirst).toBe(true);
		expect(days[2].isLast).toBe(true);
		expect(days[1].index).toBe(1);
	});
});

describe('evaluateDay – wanderung', () => {
	it('fires on a long hike and suggests a Lunchpaket', () => {
		const hits = evaluateDay(day([b('LS', 'Bergwanderung', '09:00', '15:00')]));
		const w = hits.find((h) => h.ruleId === 'wanderung');
		expect(w).toBeDefined();
		expect(w!.confidence).toBe('sicher');
		expect(w!.effects.some((e) => e.kind === 'lunchpaket')).toBe(true);
	});

	it('does not fire for a short walk under 5 h', () => {
		const hits = evaluateDay(day([b('LS', 'Wanderung', '09:00', '10:00')]));
		expect(hits.find((h) => h.ruleId === 'wanderung')).toBeUndefined();
	});
});

describe('evaluateDay – other rules', () => {
	it('fires besuchstag with a Zvieri portion factor', () => {
		const hits = evaluateDay(day([b('LP', 'Besuchstag der Eltern', '10:00', '16:00')]));
		const r = hits.find((h) => h.ruleId === 'besuchstag')!;
		expect(r.effects.some((e) => e.kind === 'portion-factor' && e.slot === 'zvieri')).toBe(true);
	});

	it('fires nachtaktivität with a Mitternachtssnack', () => {
		const hits = evaluateDay(day([b('LP', 'Nachtgeländespiel', '21:00', '23:30')]));
		const r = hits.find((h) => h.ruleId === 'nachtaktivitaet')!;
		expect(r.effects.some((e) => e.slot === 'mitternachtssnack')).toBe(true);
	});

	it('fires anreise on the first day (no kitchen for lunch)', () => {
		const hits = evaluateDay(day([b('LA', 'Zeltaufbau', '14:00', '17:00')], { isFirst: true }));
		const r = hits.find((h) => h.ruleId === 'anreise')!;
		expect(r.effects.some((e) => e.kind === 'no-kitchen')).toBe(true);
	});
});

describe('evaluateDay – early activity vs. meal', () => {
	it('fires for an early activity but not for the breakfast itself', () => {
		const hits = evaluateDay(
			day([b('ES', 'Zmorge', '07:00', '07:45'), b('LS', 'Frühsport', '07:15', '08:00')])
		);
		const r = hits.find((h) => h.ruleId === 'morgen-frueh')!;
		expect(r.triggeredBy).toBe('Frühsport');
	});

	it('does not fire when only a meal is early', () => {
		const hits = evaluateDay(day([b('ES', 'Zmorge', '07:00', '07:45')]));
		expect(hits.find((h) => h.ruleId === 'morgen-frueh')).toBeUndefined();
	});
});
