/**
 * Reactive current-locale store (Phase 6), persisted in localStorage. Import in
 * components and read `locale.current`; call `setLocale()` from the switcher.
 */

import { t, type Locale } from './index';

const KEY = 'locale';

function initial(): Locale {
	if (typeof localStorage !== 'undefined') {
		const saved = localStorage.getItem(KEY);
		if (saved === 'de' || saved === 'fr' || saved === 'it') return saved;
	}
	return 'de';
}

export const locale = $state<{ current: Locale }>({ current: initial() });

export function setLocale(next: Locale): void {
	locale.current = next;
	if (typeof localStorage !== 'undefined') {
		try {
			localStorage.setItem(KEY, next);
		} catch {
			/* ignore */
		}
	}
	if (typeof document !== 'undefined') document.documentElement.lang = next;
}

/** Convenience translator bound to the current locale. */
export function tr(key: string): string {
	return t(key, locale.current);
}
