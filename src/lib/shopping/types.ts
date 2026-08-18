/**
 * Shopping-list types (Kapitel 7.3).
 *
 * The list is grouped primarily by shopping run (before the camp / fresh runs
 * during it) and secondarily by store category in walk order. Quantities are
 * expressed in purchase units (Gebinde) with the rounding made visible.
 */

/** Store categories in the order you walk a shop (Kapitel 7.3). */
export type StoreCategory =
	| 'fruechte-gemuese'
	| 'brot'
	| 'kuehlung'
	| 'fleisch'
	| 'tiefkuehl'
	| 'trocken'
	| 'getraenke'
	| 'nonfood';

/** Walk order of the categories. */
export const STORE_ORDER: readonly StoreCategory[] = [
	'fruechte-gemuese',
	'brot',
	'kuehlung',
	'fleisch',
	'tiefkuehl',
	'trocken',
	'getraenke',
	'nonfood'
];

export const STORE_LABELS: Record<StoreCategory, string> = {
	'fruechte-gemuese': 'Früchte & Gemüse',
	brot: 'Brot',
	kuehlung: 'Kühlung',
	fleisch: 'Fleisch',
	tiefkuehl: 'Tiefkühl',
	trocken: 'Trocken & Konserven',
	getraenke: 'Getränke',
	nonfood: 'Non-Food'
};

/** A package size an ingredient is bought in. */
export interface PackageSize {
	label: string;
	amount: number;
	unit: 'g' | 'ml' | 'stk';
}

/** One line of the shopping list: what to buy and how much rounding it adds. */
export interface ShoppingItem {
	name: string;
	category: StoreCategory;
	unit: 'g' | 'ml' | 'stk';
	/** Amount actually needed by the recipes. */
	needed: number;
	/** Number of packages to buy. */
	packs: number;
	/** Package description, e.g. "500 g Päckli". */
	packLabel: string;
	/** Total amount bought (packs × package size) ≥ needed. */
	purchased: number;
	/** Overage as a fraction of the needed amount (visible rounding). */
	overage: number;
}

/** One shopping run (a shopping day), with its items grouped by store category. */
export interface ShoppingRun {
	id: string;
	label: string;
	/** ISO date hint if known. */
	date: string | null;
	byCategory: { category: StoreCategory; items: ShoppingItem[] }[];
	/** Estimated fresh volume in litres, for the fridge-capacity check. */
	fridgeLiters: number;
	/** Set when the run's fresh volume exceeds the entered fridge capacity. */
	fridgeWarning?: string;
}

export interface ShoppingList {
	runs: ShoppingRun[];
}
