/**
 * Additional menu checks (Kapitel 6, "Zusätzliche Prüfungen"):
 * variety, meal gaps and last-day leftovers. Pure functions returning warnings.
 */

/** Meals more than this many hours apart trigger a Zvieri warning. */
export const MAX_MEAL_GAP_HOURS = 5;

/** 4-day window for the variety check. */
export const VARIETY_WINDOW_DAYS = 4;

function parseHHMM(hhmm: string): number | null {
	const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
	if (!m) return null;
	return Number(m[1]) * 60 + Number(m[2]);
}

/**
 * Warns about gaps over {@link MAX_MEAL_GAP_HOURS} between consecutive meals on
 * one day (suggesting a Zvieri to bridge them).
 */
export function mealGapWarnings(mealTimes: string[]): string[] {
	const minutes = mealTimes
		.map(parseHHMM)
		.filter((m): m is number => m !== null)
		.sort((a, b) => a - b);
	const warnings: string[] = [];
	for (let i = 1; i < minutes.length; i++) {
		const gapH = (minutes[i] - minutes[i - 1]) / 60;
		if (gapH > MAX_MEAL_GAP_HOURS) {
			warnings.push(
				`Über ${MAX_MEAL_GAP_HOURS} h zwischen ${toHHMM(minutes[i - 1])} und ${toHHMM(minutes[i])} – Zvieri einplanen.`
			);
		}
	}
	return warnings;
}

function toHHMM(min: number): string {
	const h = Math.floor(min / 60);
	const m = min % 60;
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** One variety clash: a dish repeats within the rolling window. */
export interface VarietyWarning {
	day: number;
	dish: string;
	/** The earlier day index the dish already appeared on. */
	clashesWith: number;
}

/**
 * Warns when the same main dish or side (by key) appears twice within any
 * {@link VARIETY_WINDOW_DAYS}-day window.
 *
 * @param dishKeysPerDay for each day, the keys of its main dishes / sides
 */
export function varietyWarnings(
	dishKeysPerDay: string[][],
	window = VARIETY_WINDOW_DAYS
): VarietyWarning[] {
	const warnings: VarietyWarning[] = [];
	for (let day = 0; day < dishKeysPerDay.length; day++) {
		for (const dish of dishKeysPerDay[day]) {
			for (let prev = Math.max(0, day - window + 1); prev < day; prev++) {
				if (dishKeysPerDay[prev].includes(dish)) {
					warnings.push({ day, dish, clashesWith: prev });
					break;
				}
			}
		}
	}
	return warnings;
}

/**
 * Warns when fresh produce is planned for the last camp day (Kapitel 6:
 * Restenwarnung — it should be used up, not freshly bought).
 */
export function leftoverWarnings(freshIngredientNamesOnLastDay: string[]): string[] {
	return freshIngredientNamesOnLastDay.map(
		(name) =>
			`${name} ist Frischware am letzten Tag – Restenverwertung prüfen, nicht neu einkaufen.`
	);
}
