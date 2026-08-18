/**
 * Stripe webhook signature verification (pure, no env). Implements Stripe's
 * documented `Stripe-Signature` scheme with node:crypto so it is unit-testable.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verifies a `Stripe-Signature` header against the raw request body.
 *
 * @param toleranceSeconds reject events whose timestamp is older than this
 */
export function verifyStripeSignature(
	payload: string,
	signatureHeader: string,
	secret: string,
	nowSeconds: number = Math.floor(Date.now() / 1000),
	toleranceSeconds = 300
): boolean {
	const parts = Object.fromEntries(
		signatureHeader.split(',').map((kv) => {
			const i = kv.indexOf('=');
			return [kv.slice(0, i), kv.slice(i + 1)];
		})
	);
	const t = Number(parts['t']);
	const v1 = parts['v1'];
	if (!t || !v1) return false;
	if (Math.abs(nowSeconds - t) > toleranceSeconds) return false;

	const expected = createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex');
	const a = Buffer.from(v1);
	const b = Buffer.from(expected);
	return a.length === b.length && timingSafeEqual(a, b);
}

/** Builds a valid signature header for a payload (used by tests / tooling). */
export function stripeSignatureHeader(payload: string, secret: string, t: number): string {
	const v1 = createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex');
	return `t=${t},v1=${v1}`;
}
