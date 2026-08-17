/**
 * Allergen types (Kapitel 4 & 7.2).
 *
 * Allergy data are health data under revDSG and usually concern minors, so the
 * model is deliberately strict: a **controlled allergen list** (no free text)
 * and **pseudonyms only** (no real names ever enter the system).
 */

/**
 * The controlled allergen list: the 14 declarable allergens plus nickel,
 * histamine and fructose (Kapitel 4). These string keys are the only allowed
 * values — there is intentionally no free-text field for health data.
 */
export type Allergen =
	| 'gluten'
	| 'krebstiere'
	| 'eier'
	| 'fische'
	| 'erdnuesse'
	| 'soja'
	| 'milch'
	| 'schalenfruechte'
	| 'sellerie'
	| 'senf'
	| 'sesam'
	| 'sulfite'
	| 'lupinen'
	| 'weichtiere'
	| 'nickel'
	| 'histamin'
	| 'fructose';

/** Severity of an intolerance/allergy (Kapitel 4). */
export type Severity = 'unvertraeglichkeit' | 'allergie' | 'anaphylaxie';

/**
 * One person's allergy profile. Identified only by a pseudonym (e.g. `TN-07`);
 * the real-name mapping stays on paper with the camp leader (Kapitel 8).
 */
export interface AllergyProfile {
	/** Pseudonym such as `TN-07`. Never a real name. */
	pseudonym: string;
	allergens: Allergen[];
	severity: Severity;
}
