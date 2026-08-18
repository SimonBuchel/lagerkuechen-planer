import { describe, expect, it } from 'vitest';
import {
	buildQrBillPayload,
	formatReference,
	isValidIBAN,
	mod10Recursive,
	qrReference,
	type QrBill
} from './qrbill';

describe('isValidIBAN', () => {
	it('accepts a valid Swiss IBAN (spaces ignored)', () => {
		expect(isValidIBAN('CH93 0076 2011 6238 5295 7')).toBe(true);
	});

	it('rejects a corrupted IBAN', () => {
		expect(isValidIBAN('CH93 0076 2011 6238 5295 8')).toBe(false);
		expect(isValidIBAN('not-an-iban')).toBe(false);
	});
});

describe('mod10Recursive', () => {
	it('computes the canonical QR reference check digit', () => {
		// SIX example reference 21 00000 00003 13947 14300 09017 -> check digit 7.
		expect(mod10Recursive('21000000000313947143000901')).toBe(7);
	});

	it('throws on non-digits', () => {
		expect(() => mod10Recursive('12a4')).toThrow();
	});
});

describe('qrReference', () => {
	it('pads to 26 digits and appends the check digit (27 total)', () => {
		const ref = qrReference('313947143000901');
		expect(ref).toHaveLength(27);
		expect(mod10Recursive(ref.slice(0, 26))).toBe(Number(ref[26]));
	});

	it('matches the canonical 26-digit reference', () => {
		expect(qrReference('21000000000313947143000901')).toBe('210000000003139471430009017');
	});

	it('rejects overly long references', () => {
		expect(() => qrReference('1'.repeat(27))).toThrow();
	});
});

describe('formatReference', () => {
	it('groups a QR reference in right-aligned blocks of five', () => {
		expect(formatReference('210000000003139471430009017')).toBe('21 00000 00003 13947 14300 09017');
	});
});

describe('buildQrBillPayload', () => {
	const bill: QrBill = {
		iban: 'CH93 0076 2011 6238 5295 7',
		creditor: {
			name: 'Pfadi Musterlager',
			street: 'Postgasse',
			buildingNumber: '1',
			postalCode: '3000',
			town: 'Bern',
			country: 'CH'
		},
		amount: 199.95,
		currency: 'CHF',
		referenceType: 'QRR',
		reference: '313947143000901',
		message: 'Lager-Abo 2026'
	};

	const payload = buildQrBillPayload(bill);
	const lines = payload.split('\r\n');

	it('starts with the SPC header (v0200)', () => {
		expect(lines[0]).toBe('SPC');
		expect(lines[1]).toBe('0200');
		expect(lines[2]).toBe('1');
		expect(lines[3]).toBe('CH9300762011623852957');
	});

	it('formats the amount with two decimals and CHF', () => {
		expect(payload).toContain('199.95');
		expect(payload).toContain('CHF');
	});

	it('embeds a 27-digit QRR reference and the EPD trailer', () => {
		expect(payload).toContain('QRR');
		expect(lines).toContain('EPD');
		expect(payload).toContain(qrReference('313947143000901'));
	});

	it('throws on an invalid IBAN', () => {
		expect(() => buildQrBillPayload({ ...bill, iban: 'CH00 INVALID' })).toThrow();
	});
});
