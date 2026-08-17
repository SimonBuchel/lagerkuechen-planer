/**
 * The quantity formula (Kapitel 5.1), as pure, individually testable functions.
 *
 *   menge(zutat) = grundmengeProPerson
 *                × Σ(personen × altersfaktor × aktivitätsfaktor)
 *                × dietFaktor
 *                × (1 + schwundReserve)
 *
 * The middle term is `effectivePersons`, the diet term is `dietFactor`, and the
 * reserve is `shrinkageReserve`. Composing them is `scaleQuantity`.
 */

import { ACTIVITY_FACTORS, AGE_FACTORS, ROLE_FACTORS, SHRINKAGE } from './data';
import type {
	ActivityLevel,
	DietComposition,
	IngredientDietClass,
	Perishability,
	PersonGroup,
	PortionFeedback
} from './types';

/** Per-person weighting for one group: role factor if any, else age factor. */
export function personFactor(group: Pick<PersonGroup, 'role' | 'ageBand'>): number {
	return ROLE_FACTORS[group.role] ?? AGE_FACTORS[group.ageBand];
}

/** Plain head count across all groups. */
export function totalHeadcount(groups: PersonGroup[]): number {
	return groups.reduce((sum, g) => sum + g.count, 0);
}

/**
 * Σ(personen × altersfaktor × aktivitätsfaktor). The activity factor is a
 * per-day value applied to everyone.
 */
export function effectivePersons(groups: PersonGroup[], activity: ActivityLevel): number {
	const activityFactor = ACTIVITY_FACTORS[activity];
	const weighted = groups.reduce((sum, g) => sum + g.count * personFactor(g), 0);
	return weighted * activityFactor;
}

/**
 * Fraction of people who actually eat an ingredient of the given diet class.
 * Uses raw head counts (the special-diet counts are head counts).
 *
 * - `neutral` — everyone.
 * - `meat` / `fish` — everyone except vegetarians and vegans.
 * - `animalProduct` — everyone except vegans (lactose-free people still eat a
 *   substitute portion, so they are not removed from the amount).
 * - `meatAlternative` — only vegetarians and vegans (the substitute portion).
 */
export function dietFactor(
	dietClass: IngredientDietClass,
	diet: DietComposition,
	totalPeople: number
): number {
	if (totalPeople <= 0) return 0;
	const veg = diet.vegetarisch + diet.vegan;
	switch (dietClass) {
		case 'neutral':
			return 1;
		case 'meat':
		case 'fish':
			return clampFraction((totalPeople - veg) / totalPeople);
		case 'animalProduct':
			return clampFraction((totalPeople - diet.vegan) / totalPeople);
		case 'meatAlternative':
			return clampFraction(veg / totalPeople);
	}
}

function clampFraction(x: number): number {
	if (x < 0) return 0;
	if (x > 1) return 1;
	return x;
}

/** Reserve fraction: 10 % for fresh produce or the first camp day, else 5 %. */
export function shrinkageReserve(perishability: Perishability, isFirstDay = false): number {
	const isFresh = perishability === 'frisch_3_tage' || perishability === 'frisch_1_tag';
	return isFresh || isFirstDay ? SHRINKAGE.fresh : SHRINKAGE.standard;
}

/**
 * Core scaling: base amount per person → total amount for the camp.
 * Returns the raw amount in the ingredient's own unit (g / ml / stk).
 */
export function scaleQuantity(
	basePerPerson: number,
	people: number,
	diet: number,
	shrinkage: number
): number {
	return basePerPerson * people * diet * (1 + shrinkage);
}

/**
 * Calibration feedback (Kapitel 5.1): nudges a base quantity after a camp.
 * `zu_viel` shrinks it, `zu_wenig` grows it, `richtig` leaves it unchanged.
 */
export function applyFeedback(base: number, feedback: PortionFeedback, step = 0.1): number {
	switch (feedback) {
		case 'zu_viel':
			return round1(base * (1 - step));
		case 'zu_wenig':
			return round1(base * (1 + step));
		case 'richtig':
			return base;
	}
}

function round1(x: number): number {
	return Math.round(x * 10) / 10;
}
