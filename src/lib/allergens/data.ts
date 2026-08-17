/**
 * The controlled allergen list as data (Kapitel 4): labels and grouping, used to
 * populate the UI's fixed dropdown. No allergen may exist outside this list.
 */

import type { Allergen } from './types';

export interface AllergenInfo {
	key: Allergen;
	label: string;
	/** True for the 14 legally declarable allergens; false for the 3 extras. */
	declarable: boolean;
}

export const ALLERGENS: readonly AllergenInfo[] = [
	{ key: 'gluten', label: 'Glutenhaltiges Getreide', declarable: true },
	{ key: 'krebstiere', label: 'Krebstiere', declarable: true },
	{ key: 'eier', label: 'Eier', declarable: true },
	{ key: 'fische', label: 'Fische', declarable: true },
	{ key: 'erdnuesse', label: 'Erdnüsse', declarable: true },
	{ key: 'soja', label: 'Soja', declarable: true },
	{ key: 'milch', label: 'Milch (Laktose)', declarable: true },
	{ key: 'schalenfruechte', label: 'Schalenfrüchte (Nüsse)', declarable: true },
	{ key: 'sellerie', label: 'Sellerie', declarable: true },
	{ key: 'senf', label: 'Senf', declarable: true },
	{ key: 'sesam', label: 'Sesam', declarable: true },
	{ key: 'sulfite', label: 'Schwefeldioxid / Sulfite', declarable: true },
	{ key: 'lupinen', label: 'Lupinen', declarable: true },
	{ key: 'weichtiere', label: 'Weichtiere', declarable: true },
	{ key: 'nickel', label: 'Nickel', declarable: false },
	{ key: 'histamin', label: 'Histamin', declarable: false },
	{ key: 'fructose', label: 'Fructose', declarable: false }
];

const LABEL_BY_KEY = new Map(ALLERGENS.map((a) => [a.key, a.label]));

/** Human-readable label for an allergen key. */
export function allergenLabel(key: Allergen): string {
	return LABEL_BY_KEY.get(key) ?? key;
}

/** The set of all valid allergen keys, for validating input. */
export const ALLERGEN_KEYS: ReadonlySet<Allergen> = new Set(ALLERGENS.map((a) => a.key));
