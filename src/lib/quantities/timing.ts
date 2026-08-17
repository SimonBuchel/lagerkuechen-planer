/**
 * Kitchen timing (Kapitel 5.3).
 *
 * Works back from meal times: when must the kitchen get up, and does the cooking
 * window clash with a programme slot the kitchen team is assigned to?
 * Times are `"HH:MM"` strings, matching the parser output.
 */

/** Parses `"HH:MM"` to minutes since midnight. Throws on malformed input. */
export function toMinutes(hhmm: string): number {
	const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
	if (!m) throw new Error(`invalid time: ${hhmm}`);
	const h = Number(m[1]);
	const min = Number(m[2]);
	if (h > 23 || min > 59) throw new Error(`invalid time: ${hhmm}`);
	return h * 60 + min;
}

/** Formats minutes since midnight to `"HH:MM"`, wrapping into the 0..24 h range. */
export function toHHMM(minutes: number): string {
	const wrapped = ((Math.round(minutes) % 1440) + 1440) % 1440;
	const h = Math.floor(wrapped / 60);
	const m = wrapped % 60;
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * The kitchen's get-up time: first meal − preparation time − mise-en-place
 * buffer. Also reports whether it lands before midnight (i.e. an early start
 * that crosses into the previous day), which is worth flagging to the user.
 */
export function wakeUpTime(
	firstMeal: string,
	zubereitungMinuten: number,
	ruestpufferMinuten: number
): { time: string; crossesMidnight: boolean } {
	const raw = toMinutes(firstMeal) - zubereitungMinuten - ruestpufferMinuten;
	return { time: toHHMM(raw), crossesMidnight: raw < 0 };
}

/** The window during which the kitchen is cooking a meal. */
export function cookingWindow(
	mealTime: string,
	zubereitungMinuten: number
): { start: string; end: string } {
	const end = toMinutes(mealTime);
	return { start: toHHMM(end - zubereitungMinuten), end: toHHMM(end) };
}

/** Half-open interval overlap on the same day. */
export function intervalsOverlap(
	aStart: number,
	aEnd: number,
	bStart: number,
	bEnd: number
): boolean {
	return aStart < bEnd && bStart < aEnd;
}

/** A programme slot the kitchen team is assigned to. */
export interface TeamSlot {
	start: string;
	end: string;
	title: string;
}

/**
 * Reports every programme slot that overlaps the cooking window — i.e. the
 * kitchen team is expected in two places at once (Kapitel 5.3).
 */
export function cookingConflicts(
	cooking: { start: string; end: string },
	teamSlots: TeamSlot[]
): TeamSlot[] {
	const cs = toMinutes(cooking.start);
	const ce = toMinutes(cooking.end);
	return teamSlots.filter((slot) =>
		intervalsOverlap(cs, ce, toMinutes(slot.start), toMinutes(slot.end))
	);
}
