import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { config, isConfigured } from '$lib/server/env';
import { signMagicToken } from '$lib/auth/token';
import { sendMagicLink } from '$lib/server/mail';

export const load: PageServerLoad = () => ({ authConfigured: isConfigured.auth });

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim();
		if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
			return fail(400, { error: 'Bitte eine gültige E-Mail-Adresse eingeben.' });
		}
		if (!isConfigured.auth) {
			return fail(503, {
				error: 'Login ist noch nicht konfiguriert (AUTH_SECRET fehlt).',
				email
			});
		}
		const token = signMagicToken(email, config.authSecret);
		const link = `${config.baseUrl}/auth/verify?token=${encodeURIComponent(token)}`;
		const res = await sendMagicLink(email, link);
		// In dev (no mail key) the link is logged server-side; never leak it to the client.
		return { sent: true, delivered: res.sent };
	}
};
