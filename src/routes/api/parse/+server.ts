/**
 * POST /api/parse
 *
 * Receives an uploaded eCamp export PDF and returns the structured
 * {@link ParsedProgram} as JSON. Parsing runs server-side because pdf.js reads
 * the document in Node; the raw PDF bytes are never persisted here (Phase 1 is
 * stateless — persistence and consent come in later phases).
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { parseEcampPdf, workerDiagnostics, type AnalyzeOptions } from '$lib/parser';

/** Upper bound on accepted upload size (guards the parser against huge inputs). */
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

export const POST: RequestHandler = async ({ request }) => {
	let form: FormData;
	try {
		form = await request.formData();
	} catch {
		return json({ error: 'Ungültige Anfrage – bitte eine PDF-Datei hochladen.' }, { status: 400 });
	}

	const file = form.get('file');
	if (!(file instanceof File)) {
		return json({ error: 'Keine Datei erhalten.' }, { status: 400 });
	}
	if (file.size === 0) {
		return json({ error: 'Die Datei ist leer.' }, { status: 400 });
	}
	if (file.size > MAX_BYTES) {
		return json({ error: 'Die Datei ist zu gross (max. 15 MB).' }, { status: 413 });
	}

	// Optional manual corrections coming back from the wizard.
	const opts: AnalyzeOptions = {};
	const manualAnchor = form.get('anchorHour');
	if (typeof manualAnchor === 'string' && manualAnchor.trim() !== '') {
		const h = Number(manualAnchor);
		if (Number.isInteger(h) && h >= 0 && h <= 23) opts.manualAnchorHour = h;
	}
	const fallbackYear = form.get('fallbackYear');
	if (typeof fallbackYear === 'string' && fallbackYear.trim() !== '') {
		const y = Number(fallbackYear);
		if (Number.isInteger(y) && y >= 2000 && y <= 2100) opts.fallbackYear = y;
	}

	try {
		const bytes = new Uint8Array(await file.arrayBuffer());
		const program = await parseEcampPdf(bytes, opts);
		return json({ program });
	} catch (err) {
		// A failed import must be logged for the operator (Kapitel 3.4).
		console.error('[parse] eCamp import failed:', err);
		// TEMP DEBUG: surface the real cause so the deployed failure can be diagnosed.
		const detail =
			err instanceof Error ? `${err.name}: ${err.message}` : String(err);
		const stackTop = err instanceof Error && err.stack ? err.stack.split('\n').slice(0, 4).join(' | ') : '';
		return json(
			{
				error:
					'Die Datei konnte nicht als eCamp-Export gelesen werden. ' +
					'Bitte prüfe, ob es ein «Picasso»-Druck aus eCamp ist – oder erfasse die Tage manuell.',
				detail,
				stackTop,
				workerDiag: workerDiagnostics()
			},
			{ status: 422 }
		);
	}
};
