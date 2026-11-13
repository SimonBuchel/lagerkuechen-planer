/**
 * POST /api/ecamp/import  { periodIri }
 *
 * Reads one period's schedule from eCamp and returns it as a ParsedProgram —
 * the same shape the PDF parsers produce, but with exact times.
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { fetchPeriodData } from '$lib/ecamp/client';
import { mapPeriodToProgram } from '$lib/ecamp/map';
import { validateProgram } from '$lib/parser/validate';
import { config } from '$lib/server/env';
import { errorResponse, readSession } from '../_session';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const jwt = readSession(cookies);
	if (!jwt) return json({ error: 'Nicht bei eCamp angemeldet.' }, { status: 401 });

	let periodIri = '';
	try {
		const body = (await request.json()) as { periodIri?: unknown };
		periodIri = typeof body.periodIri === 'string' ? body.periodIri : '';
	} catch {
		/* handled below */
	}
	if (!/^\/api\/periods\/[\w-]+$/.test(periodIri)) {
		return json({ error: 'Ungültige Periode.' }, { status: 400 });
	}

	try {
		const data = await fetchPeriodData(config.ecampApiBase, jwt, periodIri);
		const program = mapPeriodToProgram(data);
		validateProgram(program);
		return json({ program });
	} catch (err) {
		return errorResponse(err, cookies);
	}
};
