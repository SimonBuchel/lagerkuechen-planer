/**
 * Magic-link token logic (Phase 5, Kapitel 9: Magic-Link-Auth).
 *
 * A token is `base64url(payload).base64url(hmac)`, where the HMAC-SHA256 over
 * the payload is keyed by a server secret. Pure and unit-testable; the actual
 * e-mail delivery (Resend) lives behind an env-guarded module.
 *
 * The secret must come from the environment — never hardcode it.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

export interface MagicPayload {
	/** The e-mail address the link authenticates. */
	email: string;
	/** Expiry as a Unix timestamp in seconds. */
	exp: number;
}

function b64urlEncode(buf: Buffer): string {
	return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str: string): Buffer {
	const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
	return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

function sign(payloadB64: string, secret: string): string {
	return b64urlEncode(createHmac('sha256', secret).update(payloadB64).digest());
}

/**
 * Creates a signed magic-link token for `email`, valid for `ttlSeconds`.
 *
 * @param now current time (injectable for tests)
 */
export function signMagicToken(
	email: string,
	secret: string,
	ttlSeconds = 15 * 60,
	now: Date = new Date()
): string {
	if (!secret) throw new Error('missing token secret');
	const payload: MagicPayload = {
		email: email.trim().toLowerCase(),
		exp: Math.floor(now.getTime() / 1000) + ttlSeconds
	};
	const payloadB64 = b64urlEncode(Buffer.from(JSON.stringify(payload), 'utf8'));
	return `${payloadB64}.${sign(payloadB64, secret)}`;
}

export type VerifyResult =
	| { valid: true; email: string }
	| { valid: false; reason: 'malformed' | 'bad-signature' | 'expired' };

/** Verifies a magic-link token: signature (timing-safe) then expiry. */
export function verifyMagicToken(
	token: string,
	secret: string,
	now: Date = new Date()
): VerifyResult {
	const parts = token.split('.');
	if (parts.length !== 2) return { valid: false, reason: 'malformed' };
	const [payloadB64, sigB64] = parts;

	const expected = sign(payloadB64, secret);
	const a = Buffer.from(sigB64);
	const b = Buffer.from(expected);
	if (a.length !== b.length || !timingSafeEqual(a, b)) {
		return { valid: false, reason: 'bad-signature' };
	}

	let payload: MagicPayload;
	try {
		payload = JSON.parse(b64urlDecode(payloadB64).toString('utf8'));
	} catch {
		return { valid: false, reason: 'malformed' };
	}
	if (typeof payload.email !== 'string' || typeof payload.exp !== 'number') {
		return { valid: false, reason: 'malformed' };
	}
	if (Math.floor(now.getTime() / 1000) > payload.exp) {
		return { valid: false, reason: 'expired' };
	}
	return { valid: true, email: payload.email };
}
