import { describe, expect, it } from 'vitest';
import { signMagicToken, verifyMagicToken } from './token';

const SECRET = 'test-secret-do-not-use-in-prod';
const now = new Date('2026-05-01T10:00:00Z');

describe('magic-link token', () => {
	it('round-trips a valid token and lower-cases the email', () => {
		const token = signMagicToken('Anna@Example.CH', SECRET, 900, now);
		const result = verifyMagicToken(token, SECRET, now);
		expect(result).toEqual({ valid: true, email: 'anna@example.ch' });
	});

	it('rejects a tampered payload', () => {
		const token = signMagicToken('anna@example.ch', SECRET, 900, now);
		const tampered = token.replace(/^./, (c) => (c === 'a' ? 'b' : 'a'));
		expect(verifyMagicToken(tampered, SECRET, now).valid).toBe(false);
	});

	it('rejects a wrong secret', () => {
		const token = signMagicToken('anna@example.ch', SECRET, 900, now);
		const r = verifyMagicToken(token, 'other-secret', now);
		expect(r).toMatchObject({ valid: false, reason: 'bad-signature' });
	});

	it('rejects an expired token', () => {
		const token = signMagicToken('anna@example.ch', SECRET, 900, now);
		const later = new Date(now.getTime() + 1000 * 1000);
		expect(verifyMagicToken(token, SECRET, later)).toMatchObject({
			valid: false,
			reason: 'expired'
		});
	});

	it('rejects a malformed token', () => {
		expect(verifyMagicToken('not-a-token', SECRET, now)).toMatchObject({
			valid: false,
			reason: 'malformed'
		});
	});
});
