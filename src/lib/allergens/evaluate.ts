/**
 * Per-meal allergen evaluation (Kapitel 7.2): for each meal, who cannot eat it,
 * which ingredient is the problem, and which severe cases need a hard warning.
 *
 * Pure functions over the controlled allergen data — no DB, no DOM.
 */

import type { Allergen, AllergyProfile } from './types';
import { allergenLabel } from './data';

/** The minimum an ingredient must expose for allergen evaluation. */
export interface AllergenTaggedIngredient {
	name: string;
	allergens: Allergen[];
}

/** Maps each allergen present in the meal to the ingredients that carry it. */
export function mealAllergenSources(
	ingredients: AllergenTaggedIngredient[]
): Map<Allergen, string[]> {
	const map = new Map<Allergen, string[]>();
	for (const ing of ingredients) {
		for (const a of ing.allergens) {
			const list = map.get(a) ?? [];
			if (!list.includes(ing.name)) list.push(ing.name);
			map.set(a, list);
		}
	}
	return map;
}

/** Evaluation result for one person on one meal. */
export interface ProfileMealResult {
	pseudonym: string;
	severity: AllergyProfile['severity'];
	/** Allergens of this person that the meal actually contains. */
	triggeredBy: Allergen[];
	/** Ingredients carrying those allergens (candidates to swap out). */
	offendingIngredients: string[];
	canEat: boolean;
}

/** Full evaluation of one meal against all allergy profiles. */
export interface MealEvaluation {
	perProfile: ProfileMealResult[];
	/** Pseudonyms who cannot eat the meal as-is. */
	affected: string[];
	/**
	 * Hard, non-dismissable warnings for anaphylaxis cases (Kapitel 7.2). The
	 * caller must render these so they cannot be clicked away.
	 */
	anaphylaxisWarnings: string[];
}

/**
 * Evaluates a meal (its allergen-tagged ingredients) against the given allergy
 * profiles.
 */
export function evaluateMeal(
	ingredients: AllergenTaggedIngredient[],
	profiles: AllergyProfile[]
): MealEvaluation {
	const sources = mealAllergenSources(ingredients);

	const perProfile: ProfileMealResult[] = profiles.map((profile) => {
		const triggeredBy = profile.allergens.filter((a) => sources.has(a));
		const offendingIngredients = [...new Set(triggeredBy.flatMap((a) => sources.get(a) ?? []))];
		return {
			pseudonym: profile.pseudonym,
			severity: profile.severity,
			triggeredBy,
			offendingIngredients,
			canEat: triggeredBy.length === 0
		};
	});

	const affected = perProfile.filter((p) => !p.canEat).map((p) => p.pseudonym);

	const anaphylaxisWarnings = perProfile
		.filter((p) => !p.canEat && p.severity === 'anaphylaxie')
		.map(
			(p) =>
				`${p.pseudonym}: ANAPHYLAXIE auf ${p.triggeredBy.map(allergenLabel).join(', ')}. ` +
				`Kreuzkontamination vermeiden, separates Schneidbrett und Werkzeug, Notfallmedikament ` +
				`bereithalten. Die Verantwortung liegt bei der Lagerleitung; Rücksprache mit den Eltern ist nötig.`
		);

	return { perProfile, affected, anaphylaxisWarnings };
}
