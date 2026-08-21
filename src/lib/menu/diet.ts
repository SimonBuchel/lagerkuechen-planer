/**
 * Diet-aware menu planning (user feedback): the plan should adapt to the group.
 * Few vegetarians → keep meat dishes but ensure a veggie option; a strong
 * majority vegetarian → pick vegetarian dishes outright.
 *
 * Pure functions over the recipe data so the behaviour is unit-tested.
 */

import type { Recipe } from '../recipes/types';

/** How a recipe relates to diets. */
export type DietProfile =
	/** No animal products at all. */
	| 'vegan'
	/** No meat/fish, but milk/egg/cheese. */
	| 'vegetarian'
	/** Contains meat/fish but lists a vegetarian substitute (vegiVariante). */
	| 'meat-with-vegi'
	/** Contains meat/fish and offers no vegetarian option. */
	| 'meat-only';

/** Classifies a recipe by its ingredients and whether it has a veggie variant. */
export function recipeDietProfile(recipe: Recipe): DietProfile {
	const classes = recipe.ingredients.map((i) => i.dietClass);
	const hasMeatOrFish = classes.some((c) => c === 'meat' || c === 'fish');
	if (hasMeatOrFish) {
		return recipe.vegiVariante ? 'meat-with-vegi' : 'meat-only';
	}
	return classes.includes('animalProduct') ? 'vegetarian' : 'vegan';
}

/** True if everyone (incl. vegetarians/vegans) can eat this dish as planned. */
export function isVegetarianFriendly(recipe: Recipe): boolean {
	const p = recipeDietProfile(recipe);
	return p === 'vegan' || p === 'vegetarian' || p === 'meat-with-vegi';
}

/** Share of the group that is vegetarian or vegan (0..1). */
export function vegiShare(vegetarisch: number, vegan: number, totalHeads: number): number {
	if (totalHeads <= 0) return 0;
	return Math.min(1, (vegetarisch + vegan) / totalHeads);
}

/** Threshold above which a dish should be vegetarian for everyone. */
export const MAJORITY_VEGI = 0.6;

/**
 * Orders recipes best-first for a given vegetarian share:
 *  - majority vegetarian → vegetarian/vegan dishes first, meat-only last;
 *  - some vegetarians → dishes that cover them (veggie or with a variant) first;
 *  - no vegetarians → original order.
 */
export function sortRecipesByDiet(recipes: Recipe[], share: number): Recipe[] {
	if (share <= 0) return [...recipes];
	const rank = (r: Recipe): number => {
		const p = recipeDietProfile(r);
		if (share >= MAJORITY_VEGI) {
			// Everyone should eat vegetarian.
			return { vegan: 0, vegetarian: 0, 'meat-with-vegi': 2, 'meat-only': 3 }[p];
		}
		// A minority is vegetarian: prefer dishes that cover them.
		return { 'meat-with-vegi': 0, vegetarian: 0, vegan: 1, 'meat-only': 3 }[p];
	};
	return [...recipes].sort((a, b) => rank(a) - rank(b));
}

/** Camp season — drives warm/cold dish preference. */
export type Season = 'fruehling' | 'sommer' | 'herbst' | 'winter';

/** Camp type — house camp (oven ok) vs. tent camp (keep it simple). */
export type CampType = 'haus' | 'zelt';

export const SEASON_LABELS: Record<Season, string> = {
	fruehling: 'Frühling',
	sommer: 'Sommer',
	herbst: 'Herbst',
	winter: 'Winter'
};

export const CAMP_TYPE_LABELS: Record<CampType, string> = {
	haus: 'Hauslager',
	zelt: 'Zeltlager'
};

/** Heuristic: is this a heavy, rich main (cheese/cream/roast/bake)? */
export function recipeIsHeavy(recipe: Recipe): boolean {
	return /magronen|gratin|lasagne|auflauf|braten|carbonara|r[öo]sti|pizza|raclette|fondue|hörnli|schnitzel|geschnetzelt/i.test(
		recipe.name
	);
}

/** Heuristic: is this dish served cold (salad, cold platter)? */
export function recipeIsCold(recipe: Recipe): boolean {
	const t = recipe.name.toLowerCase();
	if (/\bkalt\b|salat|müesli|muesli|bircher|z['’]?nacht kalt/.test(t)) return true;
	// A dish that needs no cooking station and no oven is effectively a cold plate.
	return recipe.cooking.kochstellen === 0 && !recipe.cooking.brauchtOfen;
}

/** How many portions need the meat-free variant of a dish. */
export function vegiPortions(vegetarisch: number, vegan: number): number {
	return Math.max(0, vegetarisch) + Math.max(0, vegan);
}

/**
 * Smart ordering used by the auto-planner: diet fit first, then season and camp
 * type. A meat dish with no vegi variant is pushed far down whenever anyone eats
 * vegetarian, so the plan never strands the vegetarians.
 */
export function sortRecipesSmart(
	recipes: Recipe[],
	opts: { share?: number; season?: Season; campType?: CampType } = {}
): Recipe[] {
	const share = opts.share ?? 0;
	const score = (r: Recipe): number => {
		const p = recipeDietProfile(r);
		// Diet weight dominates (×100).
		let s: number;
		if (share <= 0) s = 0;
		else if (share >= MAJORITY_VEGI)
			s = { vegan: 0, vegetarian: 0, 'meat-with-vegi': 2, 'meat-only': 6 }[p];
		else s = { 'meat-with-vegi': 0, vegetarian: 0, vegan: 1, 'meat-only': 5 }[p];
		s *= 100;

		// Season: prefer warm dishes in autumn/winter, allow cold in summer.
		const cold = recipeIsCold(r);
		if ((opts.season === 'herbst' || opts.season === 'winter') && cold) s += 30;
		if (opts.season === 'sommer' && !cold) s += 8;

		// Tent camps: an oven is impractical.
		if (opts.campType === 'zelt' && r.cooking.brauchtOfen) s += 20;

		// Prefer lighter dishes so heavy, rich meals don't dominate the week.
		if (recipeIsHeavy(r)) s += 18;

		return s;
	};
	return [...recipes].sort((a, b) => score(a) - score(b));
}

/** Per-meal diet status shown to the user. */
export interface MealDietStatus {
	profile: DietProfile;
	/** Everyone in the group can eat this meal. */
	ok: boolean;
	/** Short hint, e.g. why a veggie alternative is still needed. */
	hint?: string;
}

/** Evaluates a chosen recipe against the group's vegetarian share. */
export function mealDietStatus(recipe: Recipe, share: number): MealDietStatus {
	const profile = recipeDietProfile(recipe);
	if (share <= 0) return { profile, ok: true };

	if (profile === 'meat-only') {
		return {
			profile,
			ok: false,
			hint:
				share >= MAJORITY_VEGI
					? 'Mehrheit isst vegetarisch – besser ein Vegi-Gericht wählen.'
					: 'Vegetarier:innen im Lager – Vegi-Alternative oder Zusatz nötig.'
		};
	}
	if (profile === 'meat-with-vegi') {
		return { profile, ok: true, hint: 'Vegi-Variante separat zubereiten.' };
	}
	return { profile, ok: true };
}
