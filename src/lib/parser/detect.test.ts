import { describe, expect, it } from 'vitest';
import { detectLayout } from './detect';
import type { PageGeometry, Word } from './types';

function w(text: string, x0: number, top: number): Word {
	return { text, x0, x1: x0 + text.length * 6, top, bottom: top + 10 };
}

function page(words: Word[], extra: Partial<PageGeometry> = {}): PageGeometry {
	return { width: 842, height: 600, rects: [], words, ...extra };
}

describe('detectLayout', () => {
	it('recognises the Picasso print from metadata, marker and fragmentation', () => {
		const frag = 'Programmoverview'.split('').map((c, i) => w(c, 40 + i * 6, 60));
		const p = page([w('eCamp v3', 400, 20), ...frag], {
			docTitle:
				'app.ecamp3.ch/print/?config={"camp":"/camps/x","contents":[{"type":"Picasso"}]}',
			docProducer: 'Skia/PDF m141'
		});
		const d = detectLayout([p]);
		expect(d.layout).toBe('picasso');
		expect(d.score).toBeGreaterThan(0);
	});

	it('recognises the Grobprogramm export from producer, marker and clean headers', () => {
		const words = [
			w('Grobprogramm Hauptlager', 30, 40),
			w('Fr 23.10.2026', 150, 56),
			w('Sa 24.10.2026', 400, 56),
			w('07:00', 33, 100),
			w('07:00', 790, 100),
			w('08:00', 33, 124),
			w('08:00', 790, 124),
			w('ES Zmorge', 160, 110),
			w('LP 2.1 Morge Tanz', 160, 134)
		];
		const d = detectLayout([page(words, { docProducer: 'PDFKit' })]);
		expect(d.layout).toBe('grobprogramm');
		expect(d.score).toBeLessThan(0);
	});

	it('still resolves when metadata is missing (structural signals only)', () => {
		const words = [
			w('Grobprogramm Hauptlager', 30, 40),
			w('Mo 05.08.2024', 150, 56),
			w('Di 06.08.2024', 400, 56),
			w('07:00', 33, 100),
			w('07:00', 790, 100),
			w('08:00', 33, 124),
			w('08:00', 790, 124)
		];
		expect(detectLayout([page(words)]).layout).toBe('grobprogramm');
	});
});
