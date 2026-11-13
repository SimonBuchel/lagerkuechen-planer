import { describe, expect, it } from 'vitest';
import {
	absolute,
	collectAll,
	decodeSession,
	encodeSession,
	halItems,
	halLink,
	iriId,
	jwtExpiry,
	normalizeScheduleEntry,
	parseSetCookies,
	pickJwtCookies,
	resolveLinks,
	sessionCookieHeader,
	stripTemplate
} from './client';

const BASE = 'https://app.ecamp3.ch/api';

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
	return new Response(JSON.stringify(body), {
		status: 200,
		headers: { 'content-type': 'application/hal+json' },
		...init
	});
}

describe('HAL helpers', () => {
	it('strips URI templates and reads links', () => {
		expect(stripTemplate('/api/camps{/id}{?page}')).toBe('/api/camps');
		expect(halLink({ _links: { self: { href: '/api/camps/1{?x}' } } }, 'self')).toBe('/api/camps/1');
		expect(halLink({}, 'self')).toBeNull();
	});
	it('extracts collection items from the common shapes', () => {
		expect(halItems({ _embedded: { items: [{ a: 1 }] } })).toEqual([{ a: 1 }]);
		expect(halItems({ items: [{ b: 2 }] })).toEqual([{ b: 2 }]);
		expect(halItems({ 'hydra:member': [{ c: 3 }] })).toEqual([{ c: 3 }]);
		expect(halItems(null)).toEqual([]);
	});
	it('resolves absolute URLs and ids', () => {
		expect(absolute(BASE, '/api/camps/1')).toBe('https://app.ecamp3.ch/api/camps/1');
		expect(absolute(BASE, 'https://x.test/y')).toBe('https://x.test/y');
		expect(iriId('/api/camps/abc/')).toBe('abc');
	});
	it('normalises schedule entries with IRI or embedded activity', () => {
		const viaIri = normalizeScheduleEntry({
			_links: { self: { href: '/api/schedule_entries/1' }, activity: { href: '/api/activities/9' } },
			start: '2024-07-06T08:30:00+00:00',
			end: '2024-07-06T09:00:00+00:00'
		});
		expect(viaIri?.activityIri).toBe('/api/activities/9');
		const embedded = normalizeScheduleEntry({
			_links: { self: { href: '/api/schedule_entries/2' } },
			_embedded: { activity: { _links: { self: { href: '/api/activities/7' } }, title: 'X' } },
			start: '2024-07-06T10:00:00+00:00',
			end: '2024-07-06T11:00:00+00:00'
		});
		expect(embedded?.activity?.title).toBe('X');
		expect(embedded?.activityIri).toBe('/api/activities/7');
	});
});

describe('session cookies', () => {
	it('parses Set-Cookie headers and picks the split JWT, with or without prefix', () => {
		const headers = new Headers();
		headers.append('set-cookie', 'jwt_hp=aaa.bbb; Path=/; Secure');
		headers.append('set-cookie', 'jwt_s=ccc; Path=/; HttpOnly');
		const jwt = pickJwtCookies(parseSetCookies(headers));
		expect(jwt).toEqual({ hpName: 'jwt_hp', hp: 'aaa.bbb', sName: 'jwt_s', s: 'ccc' });
		expect(pickJwtCookies({ prod_jwt_hp: 'x', prod_jwt_s: 'y' })?.hpName).toBe('prod_jwt_hp');
		expect(pickJwtCookies({ other: '1' })).toBeNull();
	});
	it('round-trips our own session cookie and builds the Cookie header', () => {
		const jwt = { hpName: 'jwt_hp', hp: 'h.p', sName: 'jwt_s', s: 's' };
		expect(decodeSession(encodeSession(jwt))).toEqual(jwt);
		expect(decodeSession('garbage')).toBeNull();
		expect(sessionCookieHeader(jwt)).toBe('jwt_hp=h.p; jwt_s=s');
	});
	it('reads the exp claim from the header+payload part', () => {
		const payload = Buffer.from(JSON.stringify({ exp: 1700000000 })).toString('base64url');
		expect(jwtExpiry(`hdr.${payload}`)).toBe(1700000000);
		expect(jwtExpiry('nope')).toBeNull();
	});
});

describe('network helpers (fake fetch)', () => {
	it('follows pagination and resolves entrypoint links with fallbacks', async () => {
		const calls: string[] = [];
		const fakeFetch: typeof fetch = async (input) => {
			const url = String(input);
			calls.push(url);
			if (url.endsWith('/api')) return jsonResponse({ _links: { camps: { href: '/api/camps{/id}' } } });
			if (url.endsWith('/api/camps')) {
				return jsonResponse({
					_embedded: { items: [{ _links: { self: { href: '/api/camps/1' } }, name: 'A' }] },
					_links: { next: { href: '/api/camps?page=2' } }
				});
			}
			if (url.endsWith('page=2')) {
				return jsonResponse({ _embedded: { items: [{ _links: { self: { href: '/api/camps/2' } }, name: 'B' }] } });
			}
			return jsonResponse({}, { status: 404 });
		};
		const links = await resolveLinks(BASE, fakeFetch);
		expect(links.camps).toBe('/api/camps');
		expect(links.scheduleEntries).toBe('/api/schedule_entries'); // fallback
		const items = await collectAll(BASE, links.camps, null, fakeFetch);
		expect(items.map((i) => i.name)).toEqual(['A', 'B']);
		expect(calls.filter((c) => c.includes('/api/camps')).length).toBe(2);
	});

	it('falls back to the default links when the entrypoint needs a session', async () => {
		const fakeFetch: typeof fetch = async () => jsonResponse({}, { status: 401 });
		const links = await resolveLinks(BASE, fakeFetch);
		expect(links.login).toBe('/api/authentication_token');
		expect(links.camps).toBe('/api/camps');
	});

	it('reports a bot-protection block (403 + HTML) as 503 instead of "wrong password"', async () => {
		const fakeFetch: typeof fetch = async () =>
			new Response('<!DOCTYPE html><title>Access denied</title>', {
				status: 403,
				headers: { 'content-type': 'text/html; charset=UTF-8' }
			});
		await expect(collectAll(BASE, '/api/camps', null, fakeFetch)).rejects.toMatchObject({ status: 503 });
	});

	it('turns 401 into a session error', async () => {
		const fakeFetch: typeof fetch = async () => jsonResponse({}, { status: 401 });
		await expect(collectAll(BASE, '/api/camps', null, fakeFetch)).rejects.toMatchObject({ status: 401 });
	});
});
