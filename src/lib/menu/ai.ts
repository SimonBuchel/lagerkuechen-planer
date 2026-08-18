/**
 * AI-assisted menu planning (Phase 6, optional).
 *
 * The deterministic {@link autoAssign} already produces a diet- and
 * programme-aware plan without any API. This module adds an *optional* smarter
 * planner backed by Claude: it turns the camp context into a compact prompt,
 * asks Claude to assign one recipe per meal slot, and validates the answer
 * against the recipe catalogue so an unexpected reply can never inject an
 * unknown dish. All functions here are pure and unit-tested; the actual API
 * call lives in the server route (`/api/ai-plan`) and needs ANTHROPIC_API_KEY.
 */

import type { MealSlot } from '../rules/types';
import type { Allergen } from '../allergens/types';
import { recipesForSlot } from '../recipes/registry';
import { recipeDietProfile, type DietProfile } from './diet';

/** Slots the planner fills (breakfast, two mains, snack, dessert). */
export const AI_PLAN_SLOTS: MealSlot[] = ['zmorge', 'zmittag', 'znacht', 'zvieri', 'dessert'];

/** Compact recipe description handed to the model. */
export interface CatalogEntry {
	id: string;
	name: string;
	slot: MealSlot;
	diet: DietProfile;
	allergens: Allergen[];
	tags?: string[];
}

/** A single programme day as the planner sees it. */
export interface AiDay {
	index: number;
	date: string | null;
	/** Short human label, e.g. "Tag 3". */
	label: string;
	/** Detected rule labels for the day, e.g. ["Wanderung", "Besuchstag"]. */
	activities: string[];
}

/** Everything the planner needs — built on the client, validated on the server. */
export interface AiPlanInput {
	days: AiDay[];
	heads: number;
	vegiPercent: number;
	/** Portions that need a meat-free variant (vegetarians + vegans). */
	vegiPortions?: number;
	dietSummary: string;
	allergies: { pseudonym: string; severity: string; allergens: string[] }[];
	budgetTarget: number;
	/** Camp season label, e.g. "Sommer". */
	season?: string;
	/** Camp type label, e.g. "Zeltlager". */
	campType?: string;
	catalog: CatalogEntry[];
}

/** The model's answer, after validation: one recipe id (or null) per slot per day. */
export interface AiAssignment {
	days: Partial<Record<MealSlot, string | null>>[];
}

/** Builds the compact recipe catalogue from the registry (built-in + custom). */
export function buildRecipeCatalog(): CatalogEntry[] {
	const out: CatalogEntry[] = [];
	for (const slot of AI_PLAN_SLOTS) {
		for (const r of recipesForSlot(slot)) {
			const allergens = [...new Set(r.ingredients.flatMap((i) => i.allergens))];
			out.push({ id: r.id, name: r.name, slot, diet: recipeDietProfile(r), allergens, tags: r.tags });
		}
	}
	return out;
}

function idsForSlot(catalog: CatalogEntry[], slot: MealSlot): string[] {
	return catalog.filter((c) => c.slot === slot).map((c) => c.id);
}

/**
 * JSON schema constraining the model to valid recipe ids per slot. Each slot is
 * an enum of that slot's recipe ids plus "" (leave empty), so the structured
 * output can only ever contain dishes that exist.
 */
export function aiPlanSchema(input: AiPlanInput): Record<string, unknown> {
	const dayProps: Record<string, unknown> = {};
	for (const slot of AI_PLAN_SLOTS) {
		dayProps[slot] = { type: 'string', enum: [...idsForSlot(input.catalog, slot), ''] };
	}
	return {
		type: 'object',
		additionalProperties: false,
		required: ['days'],
		properties: {
			days: {
				type: 'array',
				items: {
					type: 'object',
					additionalProperties: false,
					required: [...AI_PLAN_SLOTS],
					properties: dayProps
				}
			}
		}
	};
}

const DIET_TEXT: Record<DietProfile, string> = {
	vegan: 'vegan',
	vegetarian: 'vegetarisch',
	'meat-with-vegi': 'Fleisch (mit Vegi-Variante)',
	'meat-only': 'nur Fleisch, keine Vegi-Variante'
};

/** Builds the system and user prompt for the planner. */
export function buildAiMessages(input: AiPlanInput): { system: string; user: string } {
	const system = [
		'Du bist ein erfahrener Lagerküchen-Chef und planst ein Menü für ein Pfadi-/Jugendlager.',
		'Du weist jeder Mahlzeit genau ein Rezept aus dem gelieferten Katalog zu (per id).',
		'',
		'Harte Regeln:',
		'- Verwende ausschliesslich rezept-ids aus dem Katalog des jeweiligen Slots. Nichts erfinden.',
		'- Abwechslung: dasselbe Hauptgericht (zmittag/znacht) nicht innerhalb von 4 Tagen wiederholen.',
		'- Ernährung: Ist der Vegi-Anteil >= 60%, wähle vegetarische/vegane Gerichte. Bei kleinerem',
		'  Vegi-Anteil sind Fleischgerichte ok, aber bevorzuge solche mit Vegi-Variante ("meat-with-vegi").',
		'  Reine Fleischgerichte ("meat-only") nur, wenn es keine Vegetarier:innen im Lager gibt.',
		'- Allergien: Meide nach Möglichkeit Gerichte mit Allergenen, die im Lager als Anaphylaxie gemeldet sind.',
		'- Programm: Passe zum Tagesprogramm. An Wander-/Sporttagen einfach zu transportierende, sättigende',
		'  Gerichte; an Bau-/Aufbautagen unkomplizierte Gerichte; an Besuchstagen darf es festlicher sein.',
		'- Budget: Bleibe grob im Rahmen des Zielbudgets pro Person und Tag.',
		'- Lass einen Slot nur leer (""), wenn der Katalog dafür kein passendes Rezept hat.',
		'',
		'Antworte ausschliesslich im vorgegebenen JSON-Schema: ein Eintrag pro Tag in derselben Reihenfolge.'
	].join('\n');

	const catalogBySlot = AI_PLAN_SLOTS.map((slot) => ({
		slot,
		rezepte: input.catalog
			.filter((c) => c.slot === slot)
			.map((c) => ({
				id: c.id,
				name: c.name,
				ernaehrung: DIET_TEXT[c.diet],
				allergene: c.allergens,
				tags: c.tags ?? []
			}))
	}));

	const user = JSON.stringify(
		{
			lager: {
				personen: input.heads,
				vegiAnteilProzent: input.vegiPercent,
				vegiPortionen: input.vegiPortions,
				saison: input.season,
				lagerart: input.campType,
				ernaehrungsformen: input.dietSummary,
				allergien: input.allergies,
				zielbudgetChfProPersonTag: input.budgetTarget
			},
			tage: input.days.map((d) => ({
				tag: d.label,
				datum: d.date,
				programm: d.activities
			})),
			katalog: catalogBySlot
		},
		null,
		2
	);

	return { system, user };
}

/**
 * Validates the model's raw answer against the catalogue: keeps only ids that
 * exist for the given slot, everything else becomes null. Never throws.
 */
export function validateAssignment(input: AiPlanInput, raw: unknown): AiAssignment {
	const validBySlot: Record<string, Set<string>> = {};
	for (const slot of AI_PLAN_SLOTS) validBySlot[slot] = new Set(idsForSlot(input.catalog, slot));

	const rawDays = (raw as { days?: unknown })?.days;
	const days = input.days.map((_, i) => {
		const src = Array.isArray(rawDays) ? (rawDays[i] as Record<string, unknown> | undefined) : undefined;
		const out: Partial<Record<MealSlot, string | null>> = {};
		for (const slot of AI_PLAN_SLOTS) {
			const v = src?.[slot];
			out[slot] = typeof v === 'string' && validBySlot[slot].has(v) ? v : null;
		}
		return out;
	});
	return { days };
}
