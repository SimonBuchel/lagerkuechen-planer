/**
 * Swiss QR-bill core (Phase 5, Kapitel 9: QR-Rechnung).
 *
 * Pure functions: IBAN validation (mod-97), the QR reference check digit
 * (mod-10 recursive), and the Swiss QR Code payload per the Implementation
 * Guidelines v2.x (version 0200, structured addresses). Rendering the QR matrix
 * to SVG happens in the UI with a QR library; here we produce the exact payload
 * string it encodes, which is the part that must be correct.
 */

/** A structured postal address (address type "S"). */
export interface Address {
	name: string;
	street?: string;
	buildingNumber?: string;
	postalCode: string;
	town: string;
	/** ISO 3166 two-letter country code. */
	country: string;
}

export interface QrBill {
	/** Creditor IBAN or QR-IBAN (CH/LI), spaces allowed. */
	iban: string;
	creditor: Address;
	/** Amount in the currency's major unit, or omitted for a blank amount. */
	amount?: number;
	currency: 'CHF' | 'EUR';
	debtor?: Address;
	/** Reference type. QRR needs a QR-IBAN; SCOR a creditor reference; NON none. */
	referenceType: 'QRR' | 'SCOR' | 'NON';
	/** Raw reference number (digits for QRR); the check digit is appended for QRR. */
	reference?: string;
	/** Unstructured message (max 140 chars together with billing info). */
	message?: string;
}

/** Validates an IBAN via the ISO 7064 mod-97 check. Spaces are ignored. */
export function isValidIBAN(iban: string): boolean {
	const clean = iban.replace(/\s+/g, '').toUpperCase();
	if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(clean)) return false;
	if (clean.length < 15 || clean.length > 34) return false;
	const rearranged = clean.slice(4) + clean.slice(0, 4);
	const numeric = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
	return mod97(numeric) === 1;
}

/** Streaming mod-97 for arbitrarily long numeric strings. */
function mod97(numeric: string): number {
	let remainder = 0;
	for (const ch of numeric) {
		remainder = (remainder * 10 + Number(ch)) % 97;
	}
	return remainder;
}

/** Recursive mod-10 lookup table (Swiss QR reference / ESR check digit). */
const MOD10_TABLE = [0, 9, 4, 6, 8, 2, 7, 1, 3, 5];

/** Computes the mod-10 recursive check digit for a digit string. */
export function mod10Recursive(digits: string): number {
	let carry = 0;
	for (const ch of digits) {
		if (!/\d/.test(ch)) throw new Error(`non-digit in reference: ${ch}`);
		carry = MOD10_TABLE[(carry + Number(ch)) % 10];
	}
	return (10 - carry) % 10;
}

/**
 * Builds a 27-digit QR reference (QRR) from a raw reference number: right-align
 * to 26 digits, then append the check digit.
 */
export function qrReference(raw: string): string {
	const digits = raw.replace(/\s+/g, '');
	if (!/^\d+$/.test(digits) || digits.length > 26) {
		throw new Error('QR reference must be up to 26 digits');
	}
	const padded = digits.padStart(26, '0');
	return padded + mod10Recursive(padded);
}

/** Formats a QR reference in the usual right-aligned blocks of five. */
export function formatReference(qrr: string): string {
	const clean = qrr.replace(/\s+/g, '');
	const rev = [...clean].reverse().join('');
	const grouped = rev.match(/.{1,5}/g) ?? [];
	return grouped
		.map((g) => [...g].reverse().join(''))
		.reverse()
		.join(' ');
}

function amountString(amount: number | undefined): string {
	if (amount === undefined) return '';
	return amount.toFixed(2);
}

/**
 * Produces the Swiss QR Code payload (version 0200, structured addresses).
 * Elements are separated by CRLF as per the guidelines.
 *
 * @throws if the IBAN is invalid, or a QRR reference is missing/malformed.
 */
export function buildQrBillPayload(bill: QrBill): string {
	if (!isValidIBAN(bill.iban)) throw new Error('invalid IBAN');

	const iban = bill.iban.replace(/\s+/g, '').toUpperCase();
	const cred = bill.creditor;

	let reference = '';
	if (bill.referenceType === 'QRR') {
		if (!bill.reference) throw new Error('QRR requires a reference');
		reference = qrReference(bill.reference);
	} else if (bill.referenceType === 'SCOR') {
		if (!bill.reference) throw new Error('SCOR requires a reference');
		reference = bill.reference.replace(/\s+/g, '').toUpperCase();
	}

	const debtor = bill.debtor;
	const el: string[] = [
		'SPC',
		'0200',
		'1',
		iban,
		// Creditor (structured)
		'S',
		cred.name,
		cred.street ?? '',
		cred.buildingNumber ?? '',
		cred.postalCode,
		cred.town,
		cred.country,
		// Ultimate creditor (must be empty — 7 elements)
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		// Amount
		amountString(bill.amount),
		bill.currency,
		// Ultimate debtor (structured, or all empty)
		debtor ? 'S' : '',
		debtor?.name ?? '',
		debtor?.street ?? '',
		debtor?.buildingNumber ?? '',
		debtor?.postalCode ?? '',
		debtor?.town ?? '',
		debtor?.country ?? '',
		// Reference
		bill.referenceType,
		reference,
		bill.message ?? '',
		// Trailer
		'EPD'
	];

	return el.join('\r\n');
}
