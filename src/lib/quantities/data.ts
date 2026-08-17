/**
 * Data tables for the quantity engine (Kapitel 5.1).
 *
 * These are the calibratable numbers the briefing insists must live as data,
 * not baked into the formulas. Base quantities are raw weights per person and
 * meal; the factors weight head counts by age, role and daily activity.
 */

import type { ActivityLevel, AgeBand, Role } from './types';

export interface BaseQuantity {
	/** Stable key referenced by recipes. */
	key: string;
	label: string;
	/** Raw amount per person and meal (unit below). */
	amount: number;
	unit: 'g' | 'ml' | 'stk';
	/** Some values are per day rather than per meal (e.g. syrup, fruit). */
	per?: 'mahlzeit' | 'tag';
}

/**
 * Start values from Kapitel 5.1 (raw weights). Meant to be recalibrated from
 * real camp feedback later via {@link applyFeedback}.
 */
export const BASE_QUANTITIES: readonly BaseQuantity[] = [
	{ key: 'teigwaren', label: 'Teigwaren', amount: 110, unit: 'g' },
	{ key: 'reis', label: 'Reis', amount: 90, unit: 'g' },
	{ key: 'kartoffeln', label: 'Kartoffeln', amount: 280, unit: 'g' },
	{ key: 'fleisch', label: 'Fleisch', amount: 140, unit: 'g' },
	{ key: 'hack', label: 'Hackfleisch', amount: 130, unit: 'g' },
	{ key: 'fleischersatz', label: 'Fleischersatz', amount: 120, unit: 'g' },
	{ key: 'gemuese', label: 'Gemüse', amount: 200, unit: 'g' },
	{ key: 'salat', label: 'Salat', amount: 80, unit: 'g' },
	{ key: 'brot-zmorge', label: 'Brot (Zmorge)', amount: 90, unit: 'g' },
	{ key: 'brot-znacht', label: 'Brot (Znacht)', amount: 130, unit: 'g' },
	{ key: 'kaese', label: 'Käse', amount: 45, unit: 'g' },
	{ key: 'aufschnitt', label: 'Aufschnitt', amount: 45, unit: 'g' },
	{ key: 'konfi', label: 'Konfitüre', amount: 25, unit: 'g' },
	{ key: 'butter', label: 'Butter', amount: 20, unit: 'g' },
	{ key: 'mueesli', label: 'Müesli', amount: 60, unit: 'g' },
	{ key: 'milch', label: 'Milch', amount: 250, unit: 'ml' },
	{ key: 'suppe', label: 'Suppe', amount: 300, unit: 'ml' },
	{ key: 'sirupkonzentrat', label: 'Sirupkonzentrat', amount: 60, unit: 'ml', per: 'tag' },
	{ key: 'frucht', label: 'Frucht', amount: 1.5, unit: 'stk', per: 'tag' },
	{ key: 'zvieri', label: 'Zvieri', amount: 70, unit: 'g' },
	{ key: 'dessert', label: 'Dessert', amount: 120, unit: 'g' }
];

/** Quick lookup of a base quantity by key. */
const BASE_BY_KEY = new Map(BASE_QUANTITIES.map((b) => [b.key, b]));

export function baseQuantity(key: string): BaseQuantity | undefined {
	return BASE_BY_KEY.get(key);
}

/** Age factors (Kapitel 5.1). */
export const AGE_FACTORS: Record<AgeBand, number> = {
	'6-10': 0.7,
	'11-14': 0.9,
	'15-17': 1.1,
	'18+': 1.15
};

/**
 * Role factors that override the age factor (Kapitel 5.1). Leaders eat like
 * adults; the kitchen team works hardest. Participants and visitors fall back
 * to their age factor.
 */
export const ROLE_FACTORS: Partial<Record<Role, number>> = {
	leitende: 1.15,
	kuechenteam: 1.2
};

/** Activity factors per day (Kapitel 5.1). */
export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
	ruhetag: 0.95,
	normal: 1.0,
	sport: 1.2,
	bau: 1.15
};

/** Shrinkage / reserve (Kapitel 5.1): 5 % standard, 10 % for fresh produce and day 1. */
export const SHRINKAGE = {
	standard: 0.05,
	fresh: 0.1
} as const;
