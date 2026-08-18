/**
 * Data-retention policy (Phase 5, Kapitel 8): personal data (pseudonymous
 * persons and their allergy data) is deleted automatically 90 days after the
 * camp ends, with an e-mail warning beforehand. Recipes and templates are not
 * personal data and are kept.
 *
 * Pure functions over ISO dates so the scheduled job and the UI share one truth.
 */

/** Days after camp end when personal data must be deleted. */
export const RETENTION_DAYS = 90;

/** Days before the deletion date to send the advance-warning e-mail. */
export const WARN_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

function parseDate(iso: string): number {
	const t = Date.parse(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
	if (Number.isNaN(t)) throw new Error(`invalid date: ${iso}`);
	return t;
}

/** The ISO date (yyyy-mm-dd) on which personal data becomes due for deletion. */
export function deletionDueDate(campEndIso: string): string {
	const due = new Date(parseDate(campEndIso) + RETENTION_DAYS * DAY_MS);
	return due.toISOString().slice(0, 10);
}

export interface RetentionStatus {
	dueDate: string;
	/** Whole days from now until deletion (negative once overdue). */
	daysUntilDue: number;
	/** True when personal data should be deleted now. */
	isDue: boolean;
	/** True when the advance warning should be sent (within WARN_DAYS, not yet due). */
	shouldWarn: boolean;
}

/** Evaluates the retention status of a camp relative to `nowIso`. */
export function retentionStatus(campEndIso: string, nowIso: string): RetentionStatus {
	const dueMs = parseDate(deletionDueDate(campEndIso));
	const nowMs = parseDate(nowIso);
	const daysUntilDue = Math.floor((dueMs - nowMs) / DAY_MS);
	const isDue = nowMs >= dueMs;
	return {
		dueDate: deletionDueDate(campEndIso),
		daysUntilDue,
		isDue,
		shouldWarn: !isDue && daysUntilDue <= WARN_DAYS
	};
}

/** Data categories, split by whether they are personal (deletable) or not. */
export type DataCategory = 'person' | 'allergy' | 'consent' | 'recipe' | 'template' | 'menu';

const PERSONAL: ReadonlySet<DataCategory> = new Set(['person', 'allergy', 'consent']);

/** Whether a data category counts as personal data under the retention policy. */
export function isPersonalData(category: DataCategory): boolean {
	return PERSONAL.has(category);
}

/** Splits records into those to delete (personal) and those to keep. */
export function partitionForDeletion<T extends { category: DataCategory }>(
	records: T[]
): { toDelete: T[]; toKeep: T[] } {
	const toDelete: T[] = [];
	const toKeep: T[] = [];
	for (const r of records) (isPersonalData(r.category) ? toDelete : toKeep).push(r);
	return { toDelete, toKeep };
}
