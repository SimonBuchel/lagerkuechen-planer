/**
 * eCamp v3 API client (server-only).
 *
 * eCamp offers no OAuth for third-party apps and no personal API keys, so the
 * only way in is the user's own login: we POST their credentials to eCamp's
 * `authentication_token` endpoint once, keep the returned JWT cookies for the
 * session and never store the password. All resource URLs are resolved from
 * the API entrypoint (`_links`), nothing is hard-coded beyond the base URL.
 *
 * Network calls take an injectable `fetch` so the pure helpers and the
 * pagination/normalisation logic are unit-testable without eCamp.
 */

const HAL = 'application/hal+json';

export class EcampError extends Error {
	constructor(
		public status: number,
		message: string
	) {
		super(message);
		this.name = 'EcampError';
	}
}

/** The split JWT cookies eCamp sets on login (names may carry a prefix). */
export interface EcampJwt {
	hpName: string;
	hp: string;
	sName: string;
	s: string;
}

export interface EcampPeriod {
	id: string;
	iri: string;
	description: string;
	start: string;
	end: string;
}

export interface EcampCamp {
	id: string;
	iri: string;
	name: string;
	title: string;
	periods: EcampPeriod[];
}

export interface EcampCategory {
	iri: string;
	short: string | null;
	name: string | null;
	color: string | null;
}

export interface EcampActivity {
	iri: string;
	title: string;
	categoryIri: string | null;
}

export interface EcampScheduleEntry {
	iri: string;
	/** ISO date-time as serialised by eCamp (wall-clock, see `map.ts`). */
	start: string;
	end: string;
	activityIri: string | null;
	/** Present when the API embedded the activity. */
	activity?: EcampActivity;
}

/** Everything the mapper needs for one period. */
export interface EcampPeriodData {
	camp: { iri: string; name: string; title: string };
	period: EcampPeriod;
	scheduleEntries: EcampScheduleEntry[];
	activities: EcampActivity[];
	categories: EcampCategory[];
}

type Json = Record<string, unknown>;
type Fetch = typeof fetch;

// ---------------------------------------------------------------------------
// pure helpers
// ---------------------------------------------------------------------------

const isObj = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);

/** Removes URI-template parts: `/api/camps{/id}{?page}` → `/api/camps`. */
export function stripTemplate(href: string): string {
	return href.replace(/\{[^}]*\}/g, '');
}

/** `_links[rel].href` of a HAL object, template-stripped, or null. */
export function halLink(obj: unknown, rel: string): string | null {
	if (!isObj(obj) || !isObj(obj._links)) return null;
	const link = (obj._links as Json)[rel];
	if (!isObj(link)) return null;
	const href = str(link.href);
	return href ? stripTemplate(href) : null;
}

/** Items of a HAL / JSON-LD collection, tolerant of the common shapes. */
export function halItems(json: unknown): Json[] {
	if (!isObj(json)) return [];
	const emb = json._embedded;
	if (isObj(emb) && Array.isArray(emb.items)) return emb.items.filter(isObj);
	if (Array.isArray(json.items)) return json.items.filter(isObj);
	if (Array.isArray(json['hydra:member'])) return (json['hydra:member'] as unknown[]).filter(isObj);
	return [];
}

/** The `_embedded[rel]` object of a HAL item, or null. */
export function halEmbedded(obj: unknown, rel: string): Json | null {
	if (!isObj(obj) || !isObj(obj._embedded)) return null;
	const v = (obj._embedded as Json)[rel];
	return isObj(v) ? v : null;
}

/** Cookie name → value from all `Set-Cookie` headers of a response. */
export function parseSetCookies(headers: Headers): Record<string, string> {
	const h = headers as Headers & { getSetCookie?: () => string[] };
	let raw: string[] = [];
	if (typeof h.getSetCookie === 'function') raw = h.getSetCookie();
	else {
		const joined = headers.get('set-cookie');
		if (joined) raw = [joined];
	}
	const out: Record<string, string> = {};
	for (const line of raw) {
		const first = line.split(';')[0];
		const eq = first.indexOf('=');
		if (eq <= 0) continue;
		out[first.slice(0, eq).trim()] = first.slice(eq + 1).trim();
	}
	return out;
}

/** Picks the split JWT cookies (`…jwt_hp` + `…jwt_s`) out of a cookie map. */
export function pickJwtCookies(cookies: Record<string, string>): EcampJwt | null {
	const hpName = Object.keys(cookies).find((k) => /(^|_)jwt_hp$/.test(k));
	const sName = Object.keys(cookies).find((k) => /(^|_)jwt_s$/.test(k));
	if (!hpName || !sName) return null;
	return { hpName, hp: cookies[hpName], sName, s: cookies[sName] };
}

/** `exp` claim (seconds since epoch) from the header+payload cookie, or null. */
export function jwtExpiry(hp: string): number | null {
	const payload = hp.split('.')[1];
	if (!payload) return null;
	try {
		const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
		const json = JSON.parse(Buffer.from(b64, 'base64').toString('utf8')) as Json;
		return typeof json.exp === 'number' ? json.exp : null;
	} catch {
		return null;
	}
}

/** Our own session cookie carries the eCamp JWT cookies, base64url-encoded. */
export function encodeSession(jwt: EcampJwt): string {
	return Buffer.from(JSON.stringify(jwt), 'utf8').toString('base64url');
}

export function decodeSession(raw: string | undefined): EcampJwt | null {
	if (!raw) return null;
	try {
		const j = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as Json;
		const hpName = str(j.hpName), hp = str(j.hp), sName = str(j.sName), s = str(j.s);
		return hpName && hp && sName && s ? { hpName, hp, sName, s } : null;
	} catch {
		return null;
	}
}

/** The `Cookie` request header that authenticates against eCamp. */
export function sessionCookieHeader(jwt: EcampJwt): string {
	return `${jwt.hpName}=${jwt.hp}; ${jwt.sName}=${jwt.s}`;
}

/** Absolute URL for an IRI/href relative to the API origin. */
export function absolute(base: string, href: string): string {
	if (/^https?:\/\//i.test(href)) return href;
	return new URL(base).origin + (href.startsWith('/') ? href : `/${href}`);
}

/** `/api/camps/abc` → `abc` (last path segment). */
export function iriId(iri: string): string {
	return iri.replace(/\/+$/, '').split('/').pop() ?? iri;
}

// ---------------------------------------------------------------------------
// normalisation
// ---------------------------------------------------------------------------

export function normalizeCategory(item: Json): EcampCategory | null {
	const iri = halLink(item, 'self');
	if (!iri) return null;
	return { iri, short: str(item.short), name: str(item.name), color: str(item.color) };
}

export function normalizeActivity(item: Json): EcampActivity | null {
	const iri = halLink(item, 'self');
	if (!iri) return null;
	return { iri, title: str(item.title) ?? '', categoryIri: halLink(item, 'category') };
}

export function normalizeScheduleEntry(item: Json): EcampScheduleEntry | null {
	const iri = halLink(item, 'self');
	const start = str(item.start);
	const end = str(item.end);
	if (!iri || !start || !end) return null;
	const emb = halEmbedded(item, 'activity');
	const activity = emb ? (normalizeActivity(emb) ?? undefined) : undefined;
	return { iri, start, end, activityIri: halLink(item, 'activity') ?? activity?.iri ?? null, activity };
}

export function normalizePeriod(item: Json): EcampPeriod | null {
	const iri = halLink(item, 'self');
	const start = str(item.start);
	const end = str(item.end);
	if (!iri || !start || !end) return null;
	return { id: iriId(iri), iri, description: str(item.description) ?? '', start, end };
}

// ---------------------------------------------------------------------------
// network
// ---------------------------------------------------------------------------

async function apiGet(
	base: string,
	url: string,
	jwt: EcampJwt | null,
	fetchImpl: Fetch
): Promise<unknown> {
	const headers: Record<string, string> = { Accept: HAL };
	if (jwt) headers.Cookie = sessionCookieHeader(jwt);
	let res: Response;
	try {
		res = await fetchImpl(absolute(base, url), { headers });
	} catch {
		throw new EcampError(502, 'eCamp ist nicht erreichbar.');
	}
	if (res.status === 401 || res.status === 403) {
		throw new EcampError(401, 'eCamp-Sitzung abgelaufen – bitte neu anmelden.');
	}
	if (!res.ok) throw new EcampError(502, `eCamp antwortete mit HTTP ${res.status}.`);
	return res.json();
}

/** Follows `_links.next` until the collection is exhausted. */
export async function collectAll(
	base: string,
	url: string,
	jwt: EcampJwt | null,
	fetchImpl: Fetch
): Promise<Json[]> {
	const items: Json[] = [];
	let next: string | null = url;
	for (let guard = 0; next && guard < 200; guard++) {
		const page = await apiGet(base, next, jwt, fetchImpl);
		items.push(...halItems(page));
		next = halLink(page, 'next');
	}
	return items;
}

/** Resolves the API entrypoint's resource links (`camps`, `periods`, …). */
export async function resolveLinks(base: string, fetchImpl: Fetch): Promise<Record<string, string>> {
	const entry = await apiGet(base, base, null, fetchImpl);
	const out: Record<string, string> = {};
	if (isObj(entry) && isObj(entry._links)) {
		for (const [rel, link] of Object.entries(entry._links as Json)) {
			if (isObj(link) && typeof link.href === 'string') out[rel] = stripTemplate(link.href);
		}
	}
	// Sensible fallbacks keep us working even if the entrypoint shape shifts.
	out.login ??= '/api/authentication_token';
	out.camps ??= '/api/camps';
	out.periods ??= '/api/periods';
	out.scheduleEntries ??= '/api/schedule_entries';
	out.activities ??= '/api/activities';
	out.categories ??= '/api/categories';
	return out;
}

/** Logs in with the user's eCamp credentials and returns the JWT cookies. */
export async function login(
	base: string,
	identifier: string,
	password: string,
	fetchImpl: Fetch = fetch
): Promise<EcampJwt> {
	const links = await resolveLinks(base, fetchImpl);
	let res: Response;
	try {
		res = await fetchImpl(absolute(base, links.login), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Accept: HAL },
			body: JSON.stringify({ identifier, password }),
			redirect: 'manual'
		});
	} catch {
		throw new EcampError(502, 'eCamp ist nicht erreichbar.');
	}
	if (res.status === 401 || res.status === 403) {
		throw new EcampError(401, 'Anmeldung bei eCamp fehlgeschlagen – E-Mail oder Passwort falsch.');
	}
	if (!res.ok) throw new EcampError(502, `eCamp antwortete mit HTTP ${res.status}.`);
	const jwt = pickJwtCookies(parseSetCookies(res.headers));
	if (!jwt) throw new EcampError(502, 'eCamp hat keine Sitzung zurückgegeben (API geändert?).');
	return jwt;
}

/** All camps the user can see, with their periods. */
export async function fetchCamps(
	base: string,
	jwt: EcampJwt,
	fetchImpl: Fetch = fetch
): Promise<EcampCamp[]> {
	const links = await resolveLinks(base, fetchImpl);
	const [campItems, periodItems] = await Promise.all([
		collectAll(base, links.camps, jwt, fetchImpl),
		collectAll(base, links.periods, jwt, fetchImpl)
	]);
	const periodsByCamp = new Map<string, EcampPeriod[]>();
	for (const item of periodItems) {
		const p = normalizePeriod(item);
		const campIri = halLink(item, 'camp');
		if (!p || !campIri) continue;
		const list = periodsByCamp.get(campIri) ?? [];
		list.push(p);
		periodsByCamp.set(campIri, list);
	}
	const camps: EcampCamp[] = [];
	for (const item of campItems) {
		const iri = halLink(item, 'self');
		if (!iri) continue;
		const periods = (periodsByCamp.get(iri) ?? []).sort((a, b) => a.start.localeCompare(b.start));
		camps.push({
			id: iriId(iri),
			iri,
			name: str(item.name) ?? '',
			title: str(item.title) ?? str(item.name) ?? '',
			periods
		});
	}
	return camps.sort((a, b) => (b.periods[0]?.start ?? '').localeCompare(a.periods[0]?.start ?? ''));
}

/** Everything needed to map one period into a programme. */
export async function fetchPeriodData(
	base: string,
	jwt: EcampJwt,
	periodIri: string,
	fetchImpl: Fetch = fetch
): Promise<EcampPeriodData> {
	const links = await resolveLinks(base, fetchImpl);
	const periodJson = await apiGet(base, periodIri, jwt, fetchImpl);
	const period = isObj(periodJson) ? normalizePeriod(periodJson) : null;
	const campIri = halLink(periodJson, 'camp');
	if (!period || !campIri) throw new EcampError(502, 'Periode konnte nicht gelesen werden.');

	const q = (url: string, key: string, iri: string) =>
		`${url}?${encodeURIComponent(key)}=${encodeURIComponent(iri)}`;
	const [campJson, entryItems, activityItems, categoryItems] = await Promise.all([
		apiGet(base, campIri, jwt, fetchImpl),
		collectAll(base, q(links.scheduleEntries, 'period', periodIri), jwt, fetchImpl),
		collectAll(base, q(links.activities, 'camp', campIri), jwt, fetchImpl),
		collectAll(base, q(links.categories, 'camp', campIri), jwt, fetchImpl)
	]);

	const camp = {
		iri: campIri,
		name: isObj(campJson) ? (str(campJson.name) ?? '') : '',
		title: isObj(campJson) ? (str(campJson.title) ?? str(campJson.name) ?? '') : ''
	};
	return {
		camp,
		period,
		scheduleEntries: entryItems
			.map(normalizeScheduleEntry)
			.filter((e): e is EcampScheduleEntry => e !== null),
		activities: activityItems.map(normalizeActivity).filter((a): a is EcampActivity => a !== null),
		categories: categoryItems.map(normalizeCategory).filter((c): c is EcampCategory => c !== null)
	};
}
