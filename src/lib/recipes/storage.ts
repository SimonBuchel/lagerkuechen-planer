/**
 * Client-side persistence for the user's recipe library (Phase 6). Stored in
 * localStorage and registered into the runtime registry so the whole app
 * (menu, quantities, shopping) sees the custom recipes.
 */

import { importRecipes } from './library';
import { setCustomRecipes } from './registry';
import type { Recipe } from './types';

const KEY = 'custom-recipes';

/** Loads custom recipes from storage and registers them. Returns the list. */
export function loadCustomRecipes(): Recipe[] {
	if (typeof localStorage === 'undefined') return [];
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return [];
		const { recipes } = importRecipes(raw);
		setCustomRecipes(recipes);
		return recipes;
	} catch {
		return [];
	}
}

/** Persists custom recipes and registers them for the running app. */
export function saveCustomRecipes(recipes: Recipe[]): void {
	setCustomRecipes(recipes);
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(KEY, JSON.stringify(recipes));
	} catch {
		/* ignore quota errors */
	}
}
