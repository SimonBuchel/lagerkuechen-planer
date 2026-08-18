/**
 * Consent record (Kapitel 8): explicit, documented consent captured when a camp
 * with health data is created. Stored with a version and timestamp so it is
 * auditable. No personal identifiers — the camp leader keeps the name mapping
 * on paper.
 */

/** The consent text version currently in force (bump when the wording changes). */
export const CONSENT_VERSION = '2026-01';

export interface ConsentRecord {
	/** Consent text version the operator agreed to. */
	version: string;
	/** ISO timestamp of when consent was recorded. */
	grantedAt: string;
	/** Free-form role of who confirmed it (e.g. "Lagerleitung"), never a person name. */
	confirmedByRole: string;
}

/** Creates a consent record for now. */
export function recordConsent(confirmedByRole: string, now: Date = new Date()): ConsentRecord {
	return {
		version: CONSENT_VERSION,
		grantedAt: now.toISOString(),
		confirmedByRole
	};
}

/** Whether a stored consent is still valid for the current text version. */
export function isConsentCurrent(record: ConsentRecord | null | undefined): boolean {
	return !!record && record.version === CONSENT_VERSION;
}
