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

	// Preferred path: the title is (or contains) valid JSON.
	const jsonStart = rawTitle.indexOf('{');
	const jsonEnd = rawTitle.lastIndexOf('}');
	if (jsonStart !== -1 && jsonEnd > jsonStart) {
		const candidate = rawTitle.slice(jsonStart, jsonEnd + 1);
		try {
			const obj = JSON.parse(candidate) as {
				camp?: unknown;
				periods?: unknown;
			};
			const camp = typeof obj.camp === 'string' ? obj.camp : null;
			const periods = Array.isArray(obj.periods)
				? obj.periods.filter((p): p is string => typeof p === 'string')
				: [];
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
		periods
	};
}
