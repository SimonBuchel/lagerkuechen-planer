/**
 * Rough price estimates (CHF) per ingredient, as editable defaults. There is no
 * automatic price lookup (a non-goal); the user overrides these in the UI.
 * Values are Swiss ballpark retail prices, deliberately conservative.
 */

function norm(text: string): string {
	return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

interface PriceRule {
	keywords: string[];
	/** CHF per kilogram / litre / piece depending on the ingredient's unit. */
	perKg?: number;
	perL?: number;
	perStk?: number;
}

const RULES: PriceRule[] = [
	{ keywords: ['hackfleisch', 'poulet', 'fleisch', 'bratwurst', 'hack'], perKg: 15 },
	{
		keywords: ['wurst', 'speck', 'aufschnitt', 'schinken', 'wienerli', 'trockenfleisch'],
		perKg: 18
	},
	{ keywords: ['fisch'], perKg: 20 },
	{ keywords: ['kase', 'mozzarella', 'raclette'], perKg: 16 },
	{ keywords: ['butter'], perKg: 12 },
	{ keywords: ['quark', 'joghurt'], perKg: 4 },
	{ keywords: ['rahm', 'sauerrahm', 'guss'], perL: 5 },
	{ keywords: ['milch'], perL: 1.6 },
	{ keywords: ['glace'], perL: 6 },
	{ keywords: ['ol', 'oel', 'bratol'], perL: 4 },
	{ keywords: ['ei', 'eier'], perStk: 0.5 },
	{
		keywords: [
			'gemuse',
			'salat',
			'frucht',
			'apfel',
			'banane',
			'kartoffel',
			'zwiebel',
			'peperoni',
			'champignon',
			'ruebli',
			'kurbis',
			'rohkost',
			'saison'
		],
		perKg: 3.5
	},
	{
		keywords: [
			'teigwaren',
			'spaghetti',
			'hornli',
			'reis',
			'mehl',
			'griess',
			'polenta',
			'couscous',
			'linsen',
			'gnocchi',
			'spatzli',
			'lasagne'
		],
		perKg: 2.5
	},
	{ keywords: ['brot', 'zopf', 'brotli', 'brotchen'], perKg: 4 },
	{ keywords: ['konfi'], perKg: 6 },
	{ keywords: ['schoko', 'schokolade', 'kakao'], perKg: 12 },
	{
		keywords: ['bouillon', 'currypaste', 'gewurz', 'krauter', 'senf', 'ketchup', 'salsa'],
		perKg: 8
	},
	{ keywords: ['salz', 'zucker'], perKg: 2 },
	{
		keywords: [
			'soja',
			'fleischersatz',
			'tofu',
			'quorn',
			'kichererbsen',
			'bohnen',
			'linsen',
			'mais',
			'pelati',
			'tomaten'
		],
		perKg: 4
	}
];

/** CHF per single base unit (per g, per ml, or per piece). */
export function priceFor(
	name: string,
	unit: 'g' | 'ml' | 'stk',
	overrides?: Record<string, number>
): number {
	if (overrides && name in overrides) return overrides[name];
	const n = norm(name);
	for (const rule of RULES) {
		if (!rule.keywords.some((k) => n.includes(k))) continue;
		if (unit === 'g' && rule.perKg != null) return rule.perKg / 1000;
		if (unit === 'ml' && rule.perL != null) return rule.perL / 1000;
		if (unit === 'stk' && rule.perStk != null) return rule.perStk;
	}
	// Defaults per unit.
	if (unit === 'stk') return 1;
	if (unit === 'ml') return 3 / 1000;
	return 5 / 1000;
}
