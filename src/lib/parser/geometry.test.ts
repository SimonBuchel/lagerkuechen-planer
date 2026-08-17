import { describe, expect, it } from 'vitest';
import {
	decodePuaTime,
	deriveColumns,
	fitHourHeight,
	learnPuaDigits,
	resolveAnchorHour,
	topToTime
} from './geometry';
import type { FilledRect, TimeAxisInfo } from './types';

function rect(x0: number, x1: number, top = 100, bottom = 120): FilledRect {
	return { x0, x1, top, bottom, fill: { r: 0.5, g: 0.5, b: 0.5 } };
}

/** A Private-Use-Area glyph standing in for digit `d` (like eCamp's Type-3 font). */
function pua(d: number): string {
	return String.fromCodePoint(0xe070 + d);
}

/** Encodes an "HH:MM" string with PUA glyphs for its digits, keeping the colon. */
function encodePua(hhmm: string): string {
	return [...hhmm].map((c) => (c === ':' ? ':' : pua(Number(c)))).join('');
}

describe('deriveColumns', () => {
	it('clusters activity rectangles into day columns with gaps', () => {
		const rects = [rect(10, 90), rect(12, 88), rect(110, 190), rect(210, 290)];
		const cols = deriveColumns(rects, []);
		expect(cols).toHaveLength(3);
		expect(cols[0].x0).toBe(10);
		expect(cols[1].x0).toBe(110);
	});

	it('returns no columns for no rectangles', () => {
		expect(deriveColumns([], [])).toEqual([]);
	});
});

describe('fitHourHeight', () => {
	it('derives the hour height from the median label spacing', () => {
		const res = fitHourHeight([100, 120.25, 140.5, 160.75]);
		expect(res.hourHeight).toBeCloseTo(20.25, 2);
		expect(res.topOfFirst).toBe(100);
	});

	it('is robust to one irregular gap (uses median)', () => {
		const res = fitHourHeight([100, 120, 140, 200]); // last gap doubled
		expect(res.hourHeight).toBe(20);
	});

	it('throws with fewer than two labels', () => {
		expect(() => fitHourHeight([100])).toThrow();
	});
});

describe('topToTime', () => {
	const axis: TimeAxisInfo = {
		hourHeight: 20,
		anchorTop: 100,
		anchorHour: 7,
		anchorSource: 'default'
	};

	it('maps the anchor top to the anchor hour', () => {
		expect(topToTime(100, axis)).toBe('07:00');
	});

	it('maps one hour height down to the next hour', () => {
		expect(topToTime(120, axis)).toBe('08:00');
	});

	it('maps a half hour', () => {
		expect(topToTime(110, axis)).toBe('07:30');
	});
});

describe('decodePuaTime', () => {
	it('decodes a PUA-encoded HH:MM label with a supplied map', () => {
		const map = new Map<string, string>([
			[pua(0), '0'],
			[pua(7), '7']
		]);
		expect(decodePuaTime(encodePua('07:00'), map)).toBe(7);
	});

	it('returns null when a glyph is unmapped', () => {
		expect(decodePuaTime(encodePua('07:00'), new Map())).toBeNull();
	});
});

describe('learnPuaDigits', () => {
	it('learns the digit map from a monotone hourly sequence', () => {
		const labels = ['07:00', '08:00', '09:00', '10:00'].map(encodePua);
		const map = learnPuaDigits(labels);
		expect(map).not.toBeNull();
		expect(decodePuaTime(labels[0], map!)).toBe(7);
		expect(decodePuaTime(labels[3], map!)).toBe(10);
	});

	it('returns null for labels without a separator', () => {
		expect(learnPuaDigits([encodePua('0700'), encodePua('0800')])).toBeNull();
	});
});

describe('resolveAnchorHour', () => {
	it('falls back to 07:00 without a PUA map', () => {
		const r = resolveAnchorHour(undefined, undefined);
		expect(r.anchorHour).toBe(7);
		expect(r.anchorSource).toBe('default');
	});

	it('reports a decoded anchor when the map resolves', () => {
		const map = new Map<string, string>([
			[pua(0), '0'],
			[pua(6), '6']
		]);
		const r = resolveAnchorHour(encodePua('06:00'), map);
		expect(r.anchorHour).toBe(6);
		expect(r.anchorSource).toBe('decoded');
	});
});
