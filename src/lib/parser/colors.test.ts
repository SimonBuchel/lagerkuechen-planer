import { describe, expect, it } from 'vitest';
import {
	buildColorClassifier,
	categoryFromLabel,
	colorDistanceSq,
	learnLegend,
	REFERENCE_PALETTE
} from './colors';
import type { PageGeometry, RGB, Word } from './types';

const GREY: RGB = { r: 0.733, g: 0.733, b: 0.733 };
const ORANGE: RGB = { r: 1.0, g: 0.596, b: 0.0 };
const BLUE: RGB = { r: 0.565, g: 0.718, b: 0.894 };
const GREEN: RGB = { r: 0.302, g: 0.733, b: 0.322 };

function word(text: string, x0: number, top: number): Word {
	return { text, x0, x1: x0 + text.length * 5, top, bottom: top + 8 };
}

describe('categoryFromLabel', () => {
	it('maps German legend labels to categories, ignoring case and diacritics', () => {
		expect(categoryFromLabel('Essen')).toBe('ES');
		expect(categoryFromLabel('Lageraktivität')).toBe('LA');
		expect(categoryFromLabel('LAGERAKTIVITAET')).toBe('LA');
		expect(categoryFromLabel('Lagerprogramm')).toBe('LP');
		expect(categoryFromLabel('Lagersport')).toBe('LS');
	});

	it('maps a bare code prefix', () => {
		expect(categoryFromLabel('ES:')).toBe('ES');
	});

	it('returns null for unrelated text', () => {
		expect(categoryFromLabel('Legende')).toBeNull();
	});
});

describe('colorDistanceSq', () => {
	it('is zero for identical colours', () => {
		expect(colorDistanceSq(GREY, { ...GREY })).toBe(0);
	});
});

describe('learnLegend', () => {
	it('learns colour to category from foot swatches paired with labels', () => {
		// Page 800 tall; legend sits in the foot (> 640).
		const page: PageGeometry = {
			width: 600,
			height: 800,
			rects: [
				{ x0: 20, x1: 30, top: 760, bottom: 770, fill: GREY },
				{ x0: 120, x1: 130, top: 760, bottom: 770, fill: ORANGE }
			],
			words: [word('Essen', 34, 760), word('Lageraktivität', 134, 760)]
		};
		const legend = learnLegend(page);
		const es = legend.find((e) => e.category === 'ES');
		const la = legend.find((e) => e.category === 'LA');
		expect(es?.color).toEqual(GREY);
		expect(la?.color).toEqual(ORANGE);
		expect(es?.source).toBe('legend');
	});

	it('returns nothing when there are no foot swatches', () => {
		const page: PageGeometry = { width: 600, height: 800, rects: [], words: [] };
		expect(learnLegend(page)).toEqual([]);
	});
});

describe('buildColorClassifier', () => {
	it('classifies learned colours to their category', () => {
		const classifier = buildColorClassifier([
			{ color: GREY, category: 'ES', source: 'legend' },
			{ color: BLUE, category: 'LP', source: 'legend' }
		]);
		expect(classifier.classify(GREY)).toBe('ES');
		expect(classifier.classify({ r: 0.57, g: 0.72, b: 0.89 })).toBe('LP');
	});

	it('falls back to the reference palette for uncovered categories', () => {
		const classifier = buildColorClassifier([]);
		expect(classifier.classify(GREEN)).toBe('LS');
	});

	it('returns null for colours far from every known colour', () => {
		const classifier = buildColorClassifier([], { tolerance: 0.1 });
		expect(classifier.classify({ r: 0.9, g: 0.1, b: 0.9 })).toBeNull();
	});

	it('exposes the reference palette with four categories', () => {
		expect(REFERENCE_PALETTE).toHaveLength(4);
	});
});
