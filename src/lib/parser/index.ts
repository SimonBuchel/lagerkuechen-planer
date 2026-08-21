/**
 * Public API of the eCamp "Picasso" PDF parser (Phase 1).
 *
 * `parseEcampPdf` is the one-call entry point: PDF bytes → typed
 * {@link ParsedProgram}. The pure pieces (`analyze`, `colors`, `geometry`,
 * `text`, `dates`, `metadata`) are re-exported so the import wizard and the
 * test-suite can use them directly.
 */

import { analyzePages, type AnalyzeOptions } from './analyze';
import { loadPageGeometries } from './pdf';
import type { ParsedProgram } from './types';

export type { AnalyzeOptions } from './analyze';
export * from './types';
export * from './analyze';
export * from './colors';
export * from './geometry';
export * from './text';
export * from './dates';
export * from './metadata';
export { loadPageGeometries } from './pdf';

/**
 * Parses one eCamp export PDF into a structured program.
 *
 * @param data the raw PDF bytes
 * @param opts optional analysis tuning / manual corrections from the wizard
 */
export async function parseEcampPdf(
	data: Uint8Array,
	opts: AnalyzeOptions = {}
): Promise<ParsedProgram> {
	const pages = await loadPageGeometries(data);
	return analyzePages(pages, opts);
}
