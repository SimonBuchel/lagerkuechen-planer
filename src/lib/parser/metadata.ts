/**
 * Parses eCamp print metadata from the PDF `Title` field (Kapitel 3.2, step 6).
 *
 * eCamp stores the full print configuration as JSON in the document title,
 * including the camp and period ids in the shape
 * `{"camp":"/camps/<id>", ..., "periods":["/periods/<id>"]}`. We keep these for
 * deduplication and re-import.
 */

export interface DocMetadata {
	camp: string | null;
	periods: string[];
}

/**
 * Extracts camp and period ids from the raw PDF title. Tries a strict JSON
 * parse first and falls back to tolerant regex extraction, because the title is
 * sometimes truncated or wrapped by the PDF producer.
 */
export function parseTitleMetadata(rawTitle: string | undefined): DocMetadata {
	if (!rawTitle) return { camp: null, periods: [] };

	// Preferred path: the title is (or contains) valid JSON. Real eCamp titles
	// look like `app.ecamp3.ch/print/?config={...}`, and the period ids are
	// nested under `contents[].options.periods`, not at the top level — so we
	// deep-search the parsed object for `camp` and `periods`.
	const jsonStart = rawTitle.indexOf('{');
	const jsonEnd = rawTitle.lastIndexOf('}');
	if (jsonStart !== -1 && jsonEnd > jsonStart) {
		const candidate = rawTitle.slice(jsonStart, jsonEnd + 1);
		try {
			const obj = JSON.parse(candidate);
			const camp = deepFindString(obj, 'camp');
			const periods = deepFindStringArray(obj, 'periods');
			if (camp || periods.length) return { camp, periods };
		} catch {
			// fall through to regex extraction
		}
	}

	// Fallback: pull the ids out with regexes even if the JSON is malformed.
	const campMatch = rawTitle.match(/"camp"\s*:\s*"([^"]+)"/);
	const periods = [...rawTitle.matchAll(/"(\/periods\/[^"]+)"/g)].map((m) => m[1]);
	return {
		camp: campMatch ? campMatch[1] : null,
		periods: [...new Set(periods)]
	};
}

/** Recursively finds the first string value stored under `key` anywhere in `obj`. */
function deepFindString(obj: unknown, key: string): string | null {
	if (obj === null || typeof obj !== 'object') return null;
	if (Array.isArray(obj)) {
		for (const item of obj) {
			const found = deepFindString(item, key);
			if (found) return found;
		}
		return null;
	}
	const record = obj as Record<string, unknown>;
	if (typeof record[key] === 'string') return record[key] as string;
	for (const value of Object.values(record)) {
		const found = deepFindString(value, key);
		if (found) return found;
	}
	return null;
}

/** Recursively collects all string entries of any array stored under `key`. */
function deepFindStringArray(obj: unknown, key: string): string[] {
	const out: string[] = [];
	const walk = (node: unknown) => {
		if (node === null || typeof node !== 'object') return;
		if (Array.isArray(node)) {
			for (const item of node) walk(item);
			return;
		}
		const record = node as Record<string, unknown>;
		for (const [k, v] of Object.entries(record)) {
			if (k === key && Array.isArray(v)) {
				for (const item of v) if (typeof item === 'string') out.push(item);
			} else {
				walk(v);
			}
		}
	};
	walk(obj);
	return [...new Set(out)];
}
