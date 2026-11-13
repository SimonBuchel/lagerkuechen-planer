/**
 * Shared helpers for the eCamp routes: our own httpOnly session cookie that
 * carries the eCamp JWT cookies, plus uniform error → JSON mapping.
 * (Underscore-prefixed so SvelteKit treats it as a plain module, not a route.)
 */

import { json, type Cookies } from '@sveltejs/kit';
import { decodeSession, encodeSession, EcampError, jwtExpiry, type EcampJwt } from '$lib/ecamp/client';

export const SESSION_COOKIE = 'ecamp_session';

export function readSession(cookies: Cookies): EcampJwt | null {
	return decodeSession(cookies.get(SESSION_COOKIE));
}

/** Stores the eCamp JWT for as long as it is valid (bounded to 5 min … 12 h). */
export function writeSession(cookies: Cookies, jwt: EcampJwt): void {
	const exp = jwtExpiry(jwt.hp);
	const now = Math.floor(Date.now() / 1000);
	const ttl = exp ? exp - now : 3600;
	cookies.set(SESSION_COOKIE, encodeSession(jwt), {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: true,
		maxAge: Math.min(12 * 3600, Math.max(300, ttl))
	});
}

export function clearSession(cookies: Cookies): void {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

/** Maps client errors to responses; a 401 also drops our session cookie. */
export function errorResponse(err: unknown, cookies: Cookies): Response {
	if (err instanceof EcampError) {
		if (err.status === 401) clearSession(cookies);
		return json({ error: err.message }, { status: err.status });
	}
	console.error('[ecamp] unexpected error:', err);
	return json({ error: 'Unerwarteter Fehler beim Zugriff auf eCamp.' }, { status: 500 });
}
