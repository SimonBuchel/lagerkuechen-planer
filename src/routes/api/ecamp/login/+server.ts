/**
 * POST /api/ecamp/login  { identifier, password }
 *
 * Passes the user's credentials straight through to eCamp once, keeps only the
 * returned session (httpOnly cookie on our domain) and answers with the camps
 * the user can access. The password is never logged or stored.
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { fetchCamps, login } from '$lib/ecamp/client';
import { config } from '$lib/server/env';
import { errorResponse, writeSession } from '../_session';

export const POST: RequestHandler = async ({ request, cookies }) => {
	let body: { identifier?: unknown; password?: unknown };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Ungültige Anfrage.' }, { status: 400 });
	}
	const identifier = typeof body.identifier === 'string' ? body.identifier.trim() : '';
	const password = typeof body.password === 'string' ? body.password : '';
	if (!identifier || !password) {
		return json({ error: 'Bitte eCamp-E-Mail und Passwort eingeben.' }, { status: 400 });
	}

	try {
		const jwt = await login(config.ecampApiBase, identifier, password);
		writeSession(cookies, jwt);
		const camps = await fetchCamps(config.ecampApiBase, jwt);
		return json({ camps });
	} catch (err) {
		return errorResponse(err, cookies);
	}
};
