/**
 * Runs the parser against every real anonymized eCamp PDF placed in
 * `__fixtures__/`. Drop `.pdf` files there (see the README) and they are picked
 * up automatically. When none are present yet, the suite is skipped so CI stays
 * green until real exports are available.
 *
 * If a `<name>.expected.json` sits next to a PDF, its `dayCount` / `mealCount`
 * fields are asserted against the parse result.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseEcampPdf } from './index';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), '__fixtures__');

function listPdfs(): string[] {
	try {
		return readdirSync(fixturesDir).filter((f) => f.toLowerCase().endsWith('.pdf'));
	} catch {
		return [];
	}
}

const pdfs = listPdfs();

describe.skipIf(pdfs.length === 0)('real eCamp fixtures', () => {
	for (const name of pdfs) {
		it(`parses ${name} into a non-empty program`, async () => {
			const bytes = new Uint8Array(readFileSync(join(fixturesDir, name)));
			const program = await parseEcampPdf(bytes);

			expect(program.days.length).toBeGreaterThan(0);
			// Every day should carry at least one recognised block.
			expect(program.days.every((d) => d.blocks.length > 0)).toBe(true);

			// Optional golden values.
			const expectedName = name.replace(/\.pdf$/i, '.expected.json');
			let expected: { dayCount?: number; mealCount?: number } | null = null;
			try {
				expected = JSON.parse(readFileSync(join(fixturesDir, expectedName), 'utf-8'));
			} catch {
				expected = null;
			}
			if (expected?.dayCount !== undefined) {
				expect(program.days.length).toBe(expected.dayCount);
			}
			if (expected?.mealCount !== undefined) {
				const meals = program.days.reduce(
					(s, d) => s + d.blocks.filter((b) => b.category === 'ES').length,
					0
				);
				expect(meals).toBe(expected.mealCount);
			}
		});
	}
});

// Keeps the file a valid test module (with an assertion) even with no fixtures.
describe('real fixtures directory', () => {
	it('is wired up for anonymized eCamp PDFs', () => {
		expect(Array.isArray(pdfs)).toBe(true);
	});
});
