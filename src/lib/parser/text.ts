/**
 * Text reconstruction inside a block (Kapitel 3.3).
 *
 * eCamp renders titles as absolutely positioned words with no reading order and
 * wraps them mid-word without a hyphen. We collect the words, group them into
 * visual lines, join the lines with the documented rule, then clean up icons,
 * the responsible person, e-mail addresses and the category prefix.
 */

import type { Word } from './types';

/** Removes Private-Use-Area characters (U+E000–U+F8FF): icons and activity numbers. */
export function stripPua(text: string): string {
	let out = '';
	for (const ch of text) {
		const cp = ch.codePointAt(0)!;
		if (cp >= 0xe000 && cp <= 0xf8ff) continue;
		out += ch;
	}
	return out;
}

/**
 * Groups words into visual lines: sort by `top` then `x0`, and start a new line
 * whenever the vertical position jumps by more than `tolerance` points.
 */
export function groupWordsIntoLines(words: Word[], tolerance = 2): Word[][] {
	if (words.length === 0) return [];
	const sorted = [...words].sort((a, b) => a.top - b.top || a.x0 - b.x0);
	const lines: Word[][] = [];
	let current: Word[] = [sorted[0]];
	let lineTop = sorted[0].top;

	for (let i = 1; i < sorted.length; i++) {
		const w = sorted[i];
		if (Math.abs(w.top - lineTop) <= tolerance) {
			current.push(w);
		} else {
			lines.push(current.sort((a, b) => a.x0 - b.x0));
			current = [w];
			lineTop = w.top;
		}
	}
	lines.push(current.sort((a, b) => a.x0 - b.x0));
	return lines;
}

/**
 * Renders one line of words to text.
 *
 * eCamp's Skia renderer splits words into many tiny fragments ("E", "ss", "e",
 * "n") that sit flush against each other, and emits explicit " " tokens where
 * real spaces belong. So we concatenate fragments and only insert a space when
 * the horizontal gap between two fragments is wide enough to be a real space —
 * that both reassembles fragmented words and keeps genuinely separate words
 * apart when no explicit space token is present.
 */
export function lineToText(line: Word[]): string {
	if (line.length === 0) return '';
	const sorted = [...line].sort((a, b) => a.x0 - b.x0);
	let out = sorted[0].text;
	for (let i = 1; i < sorted.length; i++) {
		const prev = sorted[i - 1];
		const cur = sorted[i];
		const gap = cur.x0 - prev.x1;
		const threshold = Math.max(1.4, 0.28 * (prev.bottom - prev.top));
		out += gap > threshold ? ' ' + cur.text : cur.text;
	}
	return out.replace(/\s+/g, ' ').trim();
}

const LETTER_END = /[\p{L}]$/u;
const LOWER_START = /^[\p{Ll}]/u;

/**
 * Joins the reconstructed lines of a block into a single title.
 *
 * eCamp breaks mid-word without a hyphen. Rule (Kapitel 3.3): if line *i* ends
 * on a letter **and** line *i+1* starts with a lowercase letter, the word
 * continues — join with no space. Otherwise join with a space.
 */
export function joinLines(lineTexts: string[]): string {
	const cleaned = lineTexts.map((l) => l.trim()).filter((l) => l.length > 0);
	if (cleaned.length === 0) return '';
	let result = cleaned[0];
	for (let i = 1; i < cleaned.length; i++) {
		const prev = result;
		const next = cleaned[i];
		if (LETTER_END.test(prev) && LOWER_START.test(next)) {
			result = prev + next;
		} else {
			result = prev + ' ' + next;
		}
	}
	return result.replace(/\s+/g, ' ').trim();
}

/** Removes e-mail addresses from a title. They must never be persisted (Kapitel 8). */
export function stripEmails(text: string): string {
	return text
		.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

/**
 * Splits off content written in `[...]` as the `responsible` field and returns
 * the remaining title. Multiple bracket groups are joined with a comma.
 */
export function extractResponsible(text: string): { title: string; responsible: string | null } {
	const parts: string[] = [];
	const title = text
		.replace(/\[([^\]]*)\]/g, (_, inner: string) => {
			const trimmed = inner.replace(/^[\s,]+|[\s,]+$/g, '').trim();
			if (trimmed) parts.push(trimmed);
			return '';
		})
		// eCamp occasionally drops the opening bracket during fragmentation; strip
		// any leftover stray bracket so the title stays clean.
		.replace(/[[\]]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	return { title, responsible: parts.length ? parts.join(', ') : null };
}

/**
 * Splits off a leading `ES:` / `LA:` / `LP:` / `LS:` prefix. The category is
 * classified primarily from the fill colour, so this is only a cleanup step; we
 * still return the code in case the colour classifier came back empty.
 */
export function stripCategoryPrefix(text: string): {
	code: 'ES' | 'LA' | 'LP' | 'LS' | null;
	rest: string;
} {
	const m = text.match(/^\s*(ES|LA|LP|LS)\s*:\s*/i);
	if (!m) return { code: null, rest: text.trim() };
	return {
		code: m[1].toUpperCase() as 'ES' | 'LA' | 'LP' | 'LS',
		rest: text.slice(m[0].length).trim()
	};
}

/** Result of reconstructing all text inside one block. */
export interface ReconstructedText {
	title: string;
	responsible: string | null;
	/** Category code found in a text prefix, if any (fallback for colour classification). */
	prefixCode: 'ES' | 'LA' | 'LP' | 'LS' | null;
}

/**
 * Full text pipeline for one block: strip icons → group lines → join with the
 * wrap rule → pull out responsible → drop e-mails → strip category prefix.
 */
export function reconstructBlockText(words: Word[]): ReconstructedText {
	const lines = groupWordsIntoLines(words);
	const lineTexts = lines.map((line) => stripPua(lineToText(line)));
	const joined = joinLines(lineTexts);

	const withoutEmail = stripEmails(joined);
	const { title: withoutResp, responsible } = extractResponsible(withoutEmail);
	const { code, rest } = stripCategoryPrefix(withoutResp);

	return { title: rest, responsible, prefixCode: code };
}
