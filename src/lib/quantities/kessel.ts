/**
 * Kettle correction and equipment check (Kapitel 5.2).
 *
 * Seasonings do not scale linearly: cooking for 40 does not need ten times the
 * spice of cooking for 4. From a scale factor of 4 upwards we damp the seasoning
 * amounts, and we check that the entered kitchen can actually cook the dish.
 */

import type { CookingRequirement, KesselClass, KitchenEquipment } from './types';

/** Scale factor at and above which the seasoning correction kicks in. */
export const KESSEL_THRESHOLD = 4;

/** Damping multipliers applied to seasonings at large batch sizes (Kapitel 5.2). */
export const KESSEL_CORRECTION: Record<KesselClass, number> = {
	gewuerz: 0.75,
	salz: 0.8,
	bratfett: 0.6
};

/**
 * Correction multiplier to apply on top of linear scaling for a seasoning.
 * Below the threshold seasonings scale linearly (factor 1); at or above it they
 * are damped. The recipe should also carry the hint "schrittweise beigeben und
 * abschmecken".
 */
export function seasoningCorrection(kesselClass: KesselClass, scaleFactor: number): number {
	if (scaleFactor < KESSEL_THRESHOLD) return 1;
	return KESSEL_CORRECTION[kesselClass];
}

/**
 * Litres of kettle needed to cook a given total liquid/food volume, leaving
 * head-room so it does not boil over.
 *
 * @param totalVolumeMl total cooked volume in millilitres
 * @param fillRatio how full a kettle may be (default 0.8)
 */
export function requiredKettleLiters(totalVolumeMl: number, fillRatio = 0.8): number {
	if (totalVolumeMl <= 0) return 0;
	return roundUp1(totalVolumeMl / 1000 / fillRatio);
}

/** Preparation effort in person-minutes: a fixed setup plus a per-portion part. */
export function ruestPersonenminuten(
	basisMinuten: number,
	proPortionMinuten: number,
	portionen: number
): number {
	return Math.round(basisMinuten + proPortionMinuten * portionen);
}

/** One equipment problem found while checking a recipe against the kitchen. */
export interface EquipmentWarning {
	kind: 'kessel' | 'kochstellen' | 'ofen';
	message: string;
}

/**
 * Checks a recipe's cooking requirement against the entered kitchen. Returns a
 * (possibly empty) list of warnings; the caller surfaces them to the user.
 */
export function checkEquipment(
	req: CookingRequirement,
	equipment: KitchenEquipment
): EquipmentWarning[] {
	const warnings: EquipmentWarning[] = [];

	const largestKettle = equipment.kesselLiter.length ? Math.max(...equipment.kesselLiter) : 0;
	if (req.kesselLiter > largestKettle) {
		warnings.push({
			kind: 'kessel',
			message: `Grösster Kessel fasst ${largestKettle} l, benötigt werden ${req.kesselLiter} l – auf mehrere Kessel aufteilen.`
		});
	}

	if (req.kochstellen > equipment.gasbrenner) {
		warnings.push({
			kind: 'kochstellen',
			message: `Gericht braucht ${req.kochstellen} Kochstellen, vorhanden sind ${equipment.gasbrenner}.`
		});
	}

	if (req.brauchtOfen && !equipment.backofen) {
		warnings.push({
			kind: 'ofen',
			message: 'Gericht braucht einen Backofen, es ist keiner erfasst.'
		});
	}

	return warnings;
}

function roundUp1(x: number): number {
	return Math.ceil(x * 10) / 10;
}
