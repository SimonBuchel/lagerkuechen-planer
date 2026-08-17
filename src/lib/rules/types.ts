/**
 * Rule types for the programme→menu logic (Kapitel 6).
 *
 * Rules live as **data** (see `data.ts`), not as code. The engine (`engine.ts`)
 * is generic and just matches triggers and collects effects. Every effect
 * carries a human reason, and rules marked `vorschlag` are offered to the user,
 * never silently applied.
 */

import type { Category } from '../parser/types';

/** Meal slots a rule can act on. */
export type MealSlot =
	'zmorge' | 'zmittag' | 'zvieri' | 'znacht' | 'dessert' | 'snack' | 'mitternachtssnack';

/** How confident a rule is — suggestions are offered, never auto-applied. */
export type Confidence = 'sicher' | 'vorschlag';

/** What makes a rule fire on a given day (all present fields must match). */
export interface RuleTrigger {
	/** Case/diacritic-insensitive substrings matched against activity titles. */
	keywords?: string[];
	/** Restrict the keyword/duration match to blocks of these categories. */
	categories?: Category[];
	/** A single block must last at least this many hours. */
	minDurationH?: number;
	/** A block must start before this `"HH:MM"`. */
	startsBefore?: string;
	/** Fires only on the first / last camp day. */
	dayPosition?: 'first' | 'last';
}

/** The kind of change a rule suggests. */
export type EffectKind =
	| 'lunchpaket'
	| 'shift-earlier'
	| 'shift-later'
	| 'add-snack'
	| 'portion-factor'
	| 'style'
	| 'no-kitchen'
	| 'leftovers'
	| 'note';

/** One concrete effect of a rule, with the reason shown to the user. */
export interface RuleEffect {
	/** Meal slot the effect targets (omitted for day-wide notes). */
	slot?: MealSlot;
	kind: EffectKind;
	/** Justification shown in the UI; every automatic decision is explained. */
	reason: string;
	/** Numeric payload: minutes to shift, or a portion multiplier. */
	value?: number;
}

/** A programme→menu rule (Kapitel 6). */
export interface MenuRule {
	id: string;
	label: string;
	confidence: Confidence;
	trigger: RuleTrigger;
	effects: RuleEffect[];
}

/** A minimal activity block the engine reads (subset of the parser output). */
export interface ProgramBlock {
	category: Category | null;
	title: string;
	start: string | null;
	end: string | null;
}

/** One camp day as seen by the rule engine. */
export interface ProgramDay {
	date: string | null;
	/** 0-based index in the camp. */
	index: number;
	isFirst: boolean;
	isLast: boolean;
	blocks: ProgramBlock[];
}

/** A rule that fired, with the block that triggered it (if any). */
export interface RuleHit {
	ruleId: string;
	label: string;
	confidence: Confidence;
	/** Title of the activity block that triggered the rule, if keyword/category based. */
	triggeredBy?: string;
	effects: RuleEffect[];
}
