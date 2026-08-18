import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { config, isConfigured } from '$lib/server/env';
import { verifyMagicToken } from '$lib/auth/token';
import { createCheckoutSession } from '$lib/server/payments';

function sessionEmail(cookie: string | undefined): string | null {
	if (!cookie || !isConfigured.auth) return null;
	const r = verifyMagicToken(cookie, config.authSecret);
	return r.valid ? r.email : null;
}

export const load: PageServerLoad = ({ cookies }) => {
	const email = sessionEmail(cookies.get('lk_session'));
	return {
		email,
		authConfigured: isConfigured.auth,
		paymentsConfigured: isConfigured.payments
	};
};

export const actions: Actions = {
	logout: ({ cookies }) => {
		cookies.delete('lk_session', { path: '/' });
		redirect(303, '/');
	},

	checkout: async ({ cookies }) => {
		const email = sessionEmail(cookies.get('lk_session'));
		if (!email) redirect(303, '/login');
		const res = await createCheckoutSession(email);
		if (res.url) redirect(303, res.url);
		return { checkoutError: res.error ?? 'Zahlung nicht möglich.' };
	}
};
