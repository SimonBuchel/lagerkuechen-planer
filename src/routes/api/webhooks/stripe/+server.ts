import { json, text } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { config, isConfigured } from '$lib/server/env';
import { verifyStripeSignature } from '$lib/server/stripe-signature';

/**
 * Stripe webhook receiver (Phase 5). Verifies the signature over the raw body,
 * then would update the account's subscription status. Env-guarded scaffolding:
 * without a webhook secret it refuses, and the DB write is left as a TODO for
 * when a database is provisioned.
 */
export const POST: RequestHandler = async ({ request }) => {
	if (!isConfigured.webhooks) return text('webhooks not configured', { status: 503 });

	const payload = await request.text();
	const signature = request.headers.get('stripe-signature') ?? '';
	if (!verifyStripeSignature(payload, signature, config.stripeWebhookSecret)) {
		return text('invalid signature', { status: 400 });
	}

	const event = JSON.parse(payload) as { type: string; data: unknown };
	switch (event.type) {
		case 'checkout.session.completed':
		case 'customer.subscription.updated':
		case 'customer.subscription.deleted':
			// TODO(db): persist the new subscription state on the account.
			console.info(`[stripe] ${event.type}`);
			break;
		default:
			break;
	}
	return json({ received: true });
};
