import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { config, isConfigured } from '$lib/server/env';
import { signMagicToken, verifyMagicToken } from '$lib/auth/token';

/**
 * Verifies a magic-link token and, on success, issues a longer-lived session
 * cookie (reusing the same HMAC scheme) before redirecting to the account page.
 */
export const GET: RequestHandler = ({ url, cookies }) => {
	if (!isConfigured.auth) redirect(303, '/login');

	const token = url.searchParams.get('token') ?? '';
	const result = verifyMagicToken(token, config.authSecret);
	if (!result.valid) redirect(303, '/login?fehler=link');

	const session = signMagicToken(result.email, config.authSecret, 30 * 24 * 60 * 60);
	cookies.set('lk_session', session, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !config.baseUrl.startsWith('http://localhost'),
		maxAge: 30 * 24 * 60 * 60
	});
	redirect(303, '/konto');
};
