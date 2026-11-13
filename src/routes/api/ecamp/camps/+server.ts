/** GET /api/ecamp/camps — camps + periods for the current eCamp session (401 if none). */

import { json, type RequestHandler } from '@sveltejs/kit';
import { fetchCamps } from '$lib/ecamp/client';
import { config } from '$lib/server/env';
import { errorResponse, readSession } from '../_session';

export const GET: RequestHandler = async ({ cookies }) => {
	const jwt = readSession(cookies);
	if (!jwt) return json({ error: 'Nicht bei eCamp angemeldet.' }, { status: 401 });
	try {
		return json({ camps: await fetchCamps(config.ecampApiBase, jwt) });
	} catch (err) {
		return errorResponse(err, cookies);
	}
};
