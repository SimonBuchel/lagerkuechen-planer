/**
 * Maps an ingredient to a store category by name (Kapitel 7.3). Heuristic and
 * intentionally overridable in the UI later — the goal is a sensible walk order,
 * not perfection.
 */

import type { StoreCategory } from './types';

function norm(text: string): string {
	return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Ordered rules: the first whose keyword matches wins. */
const RULES: { category: StoreCategory; keywords: string[] }[] = [
	{ category: 'tiefkuehl', keywords: ['glace', 'tiefkuhl', 'tk ', 'fischstab', 'gemusestab'] },
	{
		category: 'fleisch',
		keywords: [
			'fleisch',
			'hack',
			'wurst',
			'speck',
			'poulet',
			'wienerli',
			'aufschnitt',
			'trockenfleisch',
			'schinken',
			'bratwurst',
			'fisch',
			'fleischkase'
		]
	},
	{
		category: 'kuehlung',
		keywords: [
			'kase',
			'milch',
			'rahm',
			'joghurt',
			'quark',
			'butter',
			'ei',
			'eier',
			'mozzarella',
			'sauerrahm',
			'raclette',
			'guss',
			'bechamel'
		]
	},
	{
		category: 'brot',
		keywords: [
			'brot',
			'zopf',
			'brotli',
			'brotchen',
			'gnocchi',
			'teig',
			'tortilla',
			'wraps',
			'spatzli'
		]
	},
	{
		category: 'fruechte-gemuese',
		keywords: [
			'gemuse',
			'salat',
			'frucht',
			'fruchte',
			'apfel',
			'banane',
			'zwiebel',
			'kartoffel',
			'peperoni',
			'champignon',
			'ruebli',
			'sellerie',
			'kurbis',
			'rohkost',
			'oliven',
			'sticks',
			'saison'
		]
	},
	{ category: 'getraenke', keywords: ['sirup', 'getrank', 'wasser', 'saft'] },
	{ category: 'nonfood', keywords: ['folie', 'servietten', 'non-food', 'abfallsack'] }
];

export function categorizeIngredient(name: string): StoreCategory {
	const n = norm(name);
	for (const rule of RULES) {
		if (rule.keywords.some((k) => n.includes(k.trim()))) return rule.category;
	}
	// Everything else (pasta, rice, flour, tins, spices, oil, sugar, chocolate…).
	return 'trocken';
}
