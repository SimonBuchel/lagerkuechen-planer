import { json, text } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { config, isConfigured } from '$lib/server/env';

/**
 * Daily retention job (Kapitel 8): deletes personal data of camps whose
 * 90-day window has passed, and sends the advance warning 7 days before.
 *
 * Protected by a bearer token (`CRON_SECRET`, reused from AUTH_SECRET here for
 * scaffolding). The actual DB work needs a provisioned database; the SQL is in
 * db/README.md and the policy lives in lib/privacy/retention.ts.
 */
export const POST: RequestHandler = async ({ request }) => {
	const auth = request.headers.get('authorization') ?? '';
	if (!isConfigured.auth || auth !== `Bearer ${config.authSecret}`) {
		return text('unauthorized', { status: 401 });
	}
	if (!isConfigured.database) {
		return json({ ok: true, note: 'no database configured – nothing to clean' });
	}

	// TODO(db): SELECT due camps, DELETE personal data, send warning e-mails.
	// See db/README.md for the exact statements; retentionStatus() decides warnings.
	return json({ ok: true, deletedCamps: 0, warnedCamps: 0 });
};
