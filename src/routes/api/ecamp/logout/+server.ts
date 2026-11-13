/** POST /api/ecamp/logout — forgets the eCamp session on our side. */

import { json, type RequestHandler } from '@sveltejs/kit';
import { clearSession } from '../_session';

export const POST: RequestHandler = async ({ cookies }) => {
	clearSession(cookies);
	return json({ ok: true });
};
