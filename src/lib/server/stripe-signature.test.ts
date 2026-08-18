import { describe, expect, it } from 'vitest';
import { stripeSignatureHeader, verifyStripeSignature } from './stripe-signature';

const SECRET = 'whsec_test';
const payload = '{"id":"evt_1","type":"checkout.session.completed"}';
const t = 1_800_000_000;

describe('verifyStripeSignature', () => {
	it('accepts a correctly signed payload within tolerance', () => {
		const header = stripeSignatureHeader(payload, SECRET, t);
		expect(verifyStripeSignature(payload, header, SECRET, t)).toBe(true);
	});

	it('rejects a tampered payload', () => {
		const header = stripeSignatureHeader(payload, SECRET, t);
		expect(verifyStripeSignature(payload + 'x', header, SECRET, t)).toBe(false);
	});

	it('rejects the wrong secret', () => {
		const header = stripeSignatureHeader(payload, SECRET, t);
		expect(verifyStripeSignature(payload, header, 'whsec_other', t)).toBe(false);
	});

	it('rejects a stale timestamp', () => {
		const header = stripeSignatureHeader(payload, SECRET, t);
		expect(verifyStripeSignature(payload, header, SECRET, t + 10_000)).toBe(false);
	});

	it('rejects a malformed header', () => {
		expect(verifyStripeSignature(payload, 'garbage', SECRET, t)).toBe(false);
	});
});
