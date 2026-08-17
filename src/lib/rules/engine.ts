/**
 * The rule engine (Kapitel 6): matches the data-defined rules against a camp
 * day and returns the rules that fired, each with its effects and reasons.
 * Pure — it never mutates the menu; suggestions are surfaced, not applied.
 */

import { MENU_RULES } from './data';
import type { MenuRule, ProgramBlock, ProgramDay, RuleHit, RuleTrigger } from './types';

/** Lower-cases and strips diacritics for robust keyword matching. */
function normalize(text: string): string {
	return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Duration of a block in hours, or null if the times are missing/invalid. */
function durationHours(block: ProgramBlock): number | null {
	if (!block.start || !block.end) return null;
	const s = parseHHMM(block.start);
	const e = parseHHMM(block.end);
	if (s === null || e === null) return null;
	const mins = e >= s ? e - s : e + 24 * 60 - s; // tolerate crossing midnight
	return mins / 60;
}

function parseHHMM(hhmm: string): number | null {
	const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
	if (!m) return null;
	return Number(m[1]) * 60 + Number(m[2]);
}

/** Blocks a rule may match: the given categories, or all activities (non-meal). */
function candidateBlocks(day: ProgramDay, trigger: RuleTrigger): ProgramBlock[] {
	if (trigger.categories && trigger.categories.length) {
		return day.blocks.filter(
			(b) => b.category !== null && trigger.categories!.includes(b.category)
		);
	}
	return day.blocks.filter((b) => b.category !== 'ES');
}

/** Whether one block satisfies all block-level criteria of a trigger. */
function blockMatches(block: ProgramBlock, trigger: RuleTrigger): boolean {
	if (trigger.keywords && trigger.keywords.length) {
		const title = normalize(block.title);
		const hit = trigger.keywords.some((k) => title.includes(normalize(k)));
		if (!hit) return false;
	}
	if (trigger.minDurationH != null) {
		const d = durationHours(block);
		if (d === null || d < trigger.minDurationH) return false;
	}
	if (trigger.startsBefore) {
		const s = block.start ? parseHHMM(block.start) : null;
		const limit = parseHHMM(trigger.startsBefore);
		if (s === null || limit === null || s >= limit) return false;
	}
	return true;
}

/** Evaluates one rule against a day; returns the triggering block, if any. */
function matchRule(rule: MenuRule, day: ProgramDay): { matched: boolean; block?: ProgramBlock } {
	const { trigger } = rule;
	if (trigger.dayPosition) {
		const ok =
			(trigger.dayPosition === 'first' && day.isFirst) ||
			(trigger.dayPosition === 'last' && day.isLast);
		return { matched: ok };
	}
	const block = candidateBlocks(day, trigger).find((b) => blockMatches(b, trigger));
	return block ? { matched: true, block } : { matched: false };
}

/** All rules that fire on the given day. */
export function evaluateDay(day: ProgramDay, rules: readonly MenuRule[] = MENU_RULES): RuleHit[] {
	const hits: RuleHit[] = [];
	for (const rule of rules) {
		const { matched, block } = matchRule(rule, day);
		if (!matched) continue;
		hits.push({
			ruleId: rule.id,
			label: rule.label,
			confidence: rule.confidence,
			triggeredBy: block?.title,
			effects: rule.effects
		});
	}
	return hits;
}

/** Rule hits for every day of a camp. */
export function evaluateProgram(
	days: ProgramDay[],
	rules: readonly MenuRule[] = MENU_RULES
): RuleHit[][] {
	return days.map((day) => evaluateDay(day, rules));
}

/** Builds engine-ready {@link ProgramDay}s from a parsed programme. */
export function toProgramDays(
	parsedDays: { date: string | null; blocks: ProgramBlock[] }[]
): ProgramDay[] {
	return parsedDays.map((d, i) => ({
		date: d.date,
		index: i,
		isFirst: i === 0,
		isLast: i === parsedDays.length - 1,
		blocks: d.blocks
	}));
}
