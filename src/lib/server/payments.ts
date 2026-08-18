/**
 * Stripe payments via the REST API (Phase 5, Kapitel 9: Stripe inkl. TWINT).
 *
 * Env-guarded scaffolding — it only calls Stripe when keys are configured, and
 * this code never contains secrets nor moves money on its own. A plain fetch
 * avoids the SDK dependency. Webhook signatures are verified with node:crypto
 * per Stripe's documented scheme (that part is pure and unit-tested).
 */

import { config, isConfigured } from './env';
export { verifyStripeSignature } from './stripe-signature';

export interface CheckoutResult {
	url?: string;
	error?: string;
}

/**
 * Creates a Stripe Checkout session for the given customer, offering card and
 * TWINT. Returns the redirect URL, or an error string when not configured.
 */
export async function createCheckoutSession(customerEmail: string): Promise<CheckoutResult> {
	if (!isConfigured.payments) return { error: 'Zahlung ist nicht konfiguriert.' };

	const body = new URLSearchParams();
	body.set('mode', 'subscription');
	body.set('line_items[0][price]', config.stripePriceId);
	body.set('line_items[0][quantity]', '1');
	body.append('payment_method_types[]', 'card');
	body.append('payment_method_types[]', 'twint');
	body.set('customer_email', customerEmail);
	body.set('success_url', `${config.baseUrl}/konto?bezahlt=1`);
	body.set('cancel_url', `${config.baseUrl}/konto?abbruch=1`);

	try {
		const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${config.stripeSecretKey}`,
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body
		});
		const data = (await res.json()) as { url?: string; error?: { message?: string } };
		if (!res.ok) return { error: data.error?.message ?? `Stripe ${res.status}` };
		return { url: data.url };
	} catch (err) {
		return { error: String(err) };
	}
}
