/**
 * Package sizes (Gebinde) per ingredient (Kapitel 7.3). Quantities on the
 * shopping list are rounded up to whole packages, and the rounding is shown.
 * A Großverbraucher mode uses larger catering packs.
 */

import type { PackageSize } from './types';

function norm(text: string): string {
	return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

interface PackRule {
	keywords: string[];
	normal: PackageSize;
	gross: PackageSize;
}

const RULES: PackRule[] = [
	{
		keywords: ['spaghetti', 'teigwaren', 'hornli', 'pasta', 'lasagne', 'spatzli', 'gnocchi'],
		normal: { label: '500 g Päckli', amount: 500, unit: 'g' },
		gross: { label: '5 kg Sack', amount: 5000, unit: 'g' }
	},
	{
		keywords: ['reis', 'couscous', 'polenta', 'linsen'],
		normal: { label: '1 kg Pack', amount: 1000, unit: 'g' },
		gross: { label: '5 kg Sack', amount: 5000, unit: 'g' }
	},
	{
		keywords: ['mehl', 'griess', 'zucker', 'paniermehl'],
		normal: { label: '1 kg Pack', amount: 1000, unit: 'g' },
		gross: { label: '5 kg Sack', amount: 5000, unit: 'g' }
	},
	{
		keywords: ['kartoffel'],
		normal: { label: '2.5 kg Sack', amount: 2500, unit: 'g' },
		gross: { label: '12.5 kg Sack', amount: 12500, unit: 'g' }
	},
	{
		keywords: [
			'hack',
			'fleisch',
			'poulet',
			'wurst',
			'speck',
			'wienerli',
			'aufschnitt',
			'schinken',
			'fisch'
		],
		normal: { label: '1 kg Pack', amount: 1000, unit: 'g' },
		gross: { label: '5 kg Gebinde', amount: 5000, unit: 'g' }
	},
	{
		keywords: ['kase', 'mozzarella', 'raclette', 'quark'],
		normal: { label: '1 kg Stück', amount: 1000, unit: 'g' },
		gross: { label: '3 kg Block', amount: 3000, unit: 'g' }
	},
	{
		keywords: ['milch', 'oel', 'ol ', 'bratol'],
		normal: { label: '1 l', amount: 1000, unit: 'ml' },
		gross: { label: '10 l Kanister', amount: 10000, unit: 'ml' }
	},
	{
		keywords: ['rahm', 'sauerrahm', 'joghurt', 'guss'],
		normal: { label: '5 dl', amount: 500, unit: 'ml' },
		gross: { label: '2 l', amount: 2000, unit: 'ml' }
	},
	{
		keywords: ['butter'],
		normal: { label: '250 g Mödeli', amount: 250, unit: 'g' },
		gross: { label: '1 kg Block', amount: 1000, unit: 'g' }
	},
	{
		keywords: ['konfi', 'schoko', 'schokolade'],
		normal: { label: '500 g', amount: 500, unit: 'g' },
		gross: { label: '2 kg', amount: 2000, unit: 'g' }
	},
	{
		keywords: [
			'bouillon',
			'currypaste',
			'salz',
			'krauter',
			'gewurz',
			'kakao',
			'senf',
			'ketchup',
			'salsa'
		],
		normal: { label: '1 kg Dose', amount: 1000, unit: 'g' },
		gross: { label: '5 kg Dose', amount: 5000, unit: 'g' }
	},
	{
		keywords: ['ei', 'eier'],
		normal: { label: '10er Karton', amount: 10, unit: 'stk' },
		gross: { label: '30er Karton', amount: 30, unit: 'stk' }
	},
	{
		keywords: [
			'gemuse',
			'salat',
			'frucht',
			'apfel',
			'banane',
			'zwiebel',
			'peperoni',
			'champignon',
			'ruebli',
			'kurbis',
			'rohkost',
			'saison'
		],
		normal: { label: '1 kg', amount: 1000, unit: 'g' },
		gross: { label: '5 kg Harass', amount: 5000, unit: 'g' }
	}
];

/**
 * Determines the package size for an ingredient. Falls back to a plain 1 kg /
 * 1 l / 1 pc package when the name is unknown.
 */
export function packageFor(
	name: string,
	unit: 'g' | 'ml' | 'stk',
	grossverbraucher = false
): PackageSize {
	const n = norm(name);
	for (const rule of RULES) {
		if (rule.keywords.some((k) => n.includes(k.trim()))) {
			const pick = grossverbraucher ? rule.gross : rule.normal;
			if (pick.unit === unit) return pick;
		}
	}
	if (unit === 'stk') return { label: 'Stück', amount: 1, unit: 'stk' };
	if (unit === 'ml')
		return {
			label: grossverbraucher ? '10 l' : '1 l',
			amount: grossverbraucher ? 10000 : 1000,
			unit: 'ml'
		};
	return {
		label: grossverbraucher ? '5 kg' : '1 kg',
		amount: grossverbraucher ? 5000 : 1000,
		unit: 'g'
	};
}
