/**
 * Third recipe collection: broadens the pool so the auto-planner has real
 * variety (user feedback: "viel mehr Rezepte", "nicht jeden Tag dasselbe").
 * Same rules as the other collections — every ingredient is allergen-tagged and
 * the preparation steps are original short prose (Kapitel 8). Most dishes cook
 * on the stove (no oven) so they work at tent camps too.
 */

import type { Recipe } from './types';

const g = (
	name: string,
	opts: Partial<Recipe['ingredients'][number]> & { baseKey?: string; amountPerPerson?: number } = {}
): Recipe['ingredients'][number] => ({
	name,
	unit: opts.unit ?? 'g',
	dietClass: opts.dietClass ?? 'neutral',
	allergens: opts.allergens ?? [],
	perishability: opts.perishability ?? 'lagerfaehig',
	baseKey: opts.baseKey,
	amountPerPerson: opts.amountPerPerson,
	kesselClass: opts.kesselClass
});

const salt = g('Salz', { amountPerPerson: 2, kesselClass: 'salz' });
const oil = g('Bratöl', { amountPerPerson: 5, unit: 'ml', kesselClass: 'bratfett' });
const bouillon = g('Gemüsebouillon', { amountPerPerson: 3, allergens: ['sellerie'], kesselClass: 'gewuerz' });

export const MORE_RECIPES: readonly Recipe[] = [
	// ---------- Zmittag (Hauptgerichte) ----------
	{
		id: 'chili-bohnentopf',
		name: 'Chili-Bohnentopf',
		slot: 'zmittag',
		vegiVariante: true,
		ingredients: [
			g('Hackfleisch', { baseKey: 'hack', dietClass: 'meat', perishability: 'frisch_1_tag' }),
			g('Sojagranulat (vegi)', { amountPerPerson: 25, dietClass: 'meatAlternative', allergens: ['soja'] }),
			g('Kidneybohnen', { amountPerPerson: 70 }),
			g('Mais', { amountPerPerson: 40 }),
			g('Pelati (Tomaten)', { amountPerPerson: 100, perishability: 'lagerfaehig' }),
			g('Zwiebel', { amountPerPerson: 20 }),
			g('Reis', { baseKey: 'reis' }),
			bouillon,
			oil,
			salt
		],
		steps: [
			'Zwiebel andünsten, Hackfleisch bzw. Soja beigeben und anbraten.',
			'Bohnen, Mais und Pelati dazugeben, würzen, 20 Minuten köcheln.',
			'Mit Reis servieren.'
		],
		cooking: { kochstellen: 2, brauchtOfen: false, ruestBasisMin: 15, ruestProPortionMin: 0.4, volumenProPortionMl: 480 }
	},
	{
		id: 'gemuese-wok-nudeln',
		name: 'Gemüse-Wok mit Nudeln',
		slot: 'zmittag',
		ingredients: [
			g('Asia-Nudeln', { baseKey: 'teigwaren', allergens: ['gluten'] }),
			g('Buntes Gemüse', { baseKey: 'gemuese', perishability: 'frisch_3_tage' }),
			g('Sojasauce', { amountPerPerson: 8, unit: 'ml', allergens: ['soja', 'gluten'], kesselClass: 'salz' }),
			g('Ingwer & Knoblauch', { amountPerPerson: 6 }),
			g('Sesam', { amountPerPerson: 3, allergens: ['sesam'] }),
			oil
		],
		steps: [
			'Nudeln kochen und abtropfen.',
			'Gemüse im heissen Öl kurz und knackig anbraten.',
			'Nudeln, Sojasauce und Sesam untermischen.'
		],
		cooking: { kochstellen: 2, brauchtOfen: false, ruestBasisMin: 15, ruestProPortionMin: 0.4 }
	},
	{
		id: 'kartoffel-gemuese-curry',
		name: 'Kartoffel-Gemüse-Curry',
		slot: 'zmittag',
		ingredients: [
			g('Kartoffeln', { baseKey: 'kartoffeln', perishability: 'lagerfaehig' }),
			g('Gemüse (Rüebli, Erbsen)', { baseKey: 'gemuese', perishability: 'frisch_3_tage' }),
			g('Kokosmilch', { amountPerPerson: 60, unit: 'ml' }),
			g('Currypaste', { amountPerPerson: 8, kesselClass: 'gewuerz' }),
			g('Reis', { baseKey: 'reis' }),
			bouillon,
			oil,
			salt
		],
		steps: [
			'Kartoffeln und Gemüse würfeln.',
			'Mit Currypaste anschwitzen, Kokosmilch und Bouillon dazu, weich köcheln.',
			'Mit Reis servieren.'
		],
		cooking: { kochstellen: 2, brauchtOfen: false, ruestBasisMin: 15, ruestProPortionMin: 0.5, volumenProPortionMl: 500 }
	},
	{
		id: 'tomatenreis-poulet',
		name: 'Tomatenreis mit Pouletstreifen',
		slot: 'zmittag',
		vegiVariante: true,
		ingredients: [
			g('Reis', { baseKey: 'reis' }),
			g('Pouletstreifen', { baseKey: 'fleisch', dietClass: 'meat', perishability: 'frisch_1_tag' }),
			g('Tofustreifen (vegi)', { baseKey: 'fleischersatz', dietClass: 'meatAlternative', allergens: ['soja'], perishability: 'frisch_3_tage' }),
			g('Pelati (Tomaten)', { amountPerPerson: 80 }),
			g('Paprika', { amountPerPerson: 40, perishability: 'frisch_3_tage' }),
			g('Zwiebel', { amountPerPerson: 15 }),
			bouillon,
			oil,
			salt
		],
		steps: [
			'Poulet bzw. Tofu anbraten und herausnehmen.',
			'Zwiebel und Paprika dünsten, Reis und Pelati dazu, in Bouillon garen.',
			'Fleisch bzw. Tofu untermischen.'
		],
		cooking: { kochstellen: 2, brauchtOfen: false, ruestBasisMin: 15, ruestProPortionMin: 0.4, volumenProPortionMl: 460 }
	},
	{
		id: 'pilzrisotto',
		name: 'Pilzrisotto',
		slot: 'zmittag',
		ingredients: [
			g('Risottoreis', { baseKey: 'reis' }),
			g('Champignons', { amountPerPerson: 70, perishability: 'frisch_3_tage' }),
			g('Zwiebel', { amountPerPerson: 15 }),
			g('Reibkäse', { amountPerPerson: 20, dietClass: 'animalProduct', allergens: ['milch'], perishability: 'frisch_3_tage' }),
			g('Butter', { amountPerPerson: 8, dietClass: 'animalProduct', allergens: ['milch'], perishability: 'frisch_3_tage' }),
			bouillon,
			salt
		],
		steps: [
			'Zwiebel und Pilze andünsten.',
			'Reis beigeben, nach und nach Bouillon angiessen und rühren.',
			'Mit Butter und Käse verfeinern.'
		],
		cooking: { kochstellen: 1, brauchtOfen: false, ruestBasisMin: 12, ruestProPortionMin: 0.5, volumenProPortionMl: 420 }
	},
	{
		id: 'linsen-dal-reis',
		name: 'Rote-Linsen-Dal mit Reis',
		slot: 'zmittag',
		ingredients: [
			g('Rote Linsen', { amountPerPerson: 70 }),
			g('Reis', { baseKey: 'reis' }),
			g('Kokosmilch', { amountPerPerson: 40, unit: 'ml' }),
			g('Tomaten', { amountPerPerson: 60, perishability: 'frisch_3_tage' }),
			g('Zwiebel & Knoblauch', { amountPerPerson: 20 }),
			g('Currygewürz', { amountPerPerson: 5, kesselClass: 'gewuerz' }),
			bouillon,
			salt
		],
		steps: [
			'Zwiebel mit Gewürzen anschwitzen.',
			'Linsen, Tomaten und Kokosmilch dazu, weich köcheln.',
			'Mit Reis servieren.'
		],
		cooking: { kochstellen: 2, brauchtOfen: false, ruestBasisMin: 12, ruestProPortionMin: 0.4, volumenProPortionMl: 500 }
	},
	{
		id: 'bohneneintopf',
		name: 'Weisser Bohneneintopf',
		slot: 'zmittag',
		ingredients: [
			g('Weisse Bohnen', { amountPerPerson: 80 }),
			g('Rüebli & Sellerie', { amountPerPerson: 60, allergens: ['sellerie'], perishability: 'frisch_3_tage' }),
			g('Kartoffeln', { baseKey: 'kartoffeln' }),
			g('Lauch', { amountPerPerson: 30, perishability: 'frisch_3_tage' }),
			bouillon,
			oil,
			salt
		],
		steps: [
			'Gemüse rüsten und würfeln.',
			'Alles in Bouillon weich köcheln.',
			'Mit Brot servieren.'
		],
		cooking: { kochstellen: 1, brauchtOfen: false, ruestBasisMin: 15, ruestProPortionMin: 0.4, volumenProPortionMl: 550 }
	},
	{
		id: 'gnocchi-gemuesesauce',
		name: 'Gnocchi an Gemüsesauce',
		slot: 'zmittag',
		ingredients: [
			g('Gnocchi', { baseKey: 'teigwaren', allergens: ['gluten'], perishability: 'frisch_3_tage' }),
			g('Zucchetti & Peperoni', { baseKey: 'gemuese', perishability: 'frisch_3_tage' }),
			g('Pelati (Tomaten)', { amountPerPerson: 90 }),
			g('Reibkäse', { amountPerPerson: 15, dietClass: 'animalProduct', allergens: ['milch'], perishability: 'frisch_3_tage' }),
			oil,
			salt
		],
		steps: [
			'Gemüse würfeln und in Öl anbraten.',
			'Pelati dazu, zu einer Sauce köcheln.',
			'Gnocchi kochen, untermischen, mit Käse bestreuen.'
		],
		cooking: { kochstellen: 2, brauchtOfen: false, ruestBasisMin: 12, ruestProPortionMin: 0.4, volumenProPortionMl: 420 }
	},

	// ---------- Znacht (oft leichter / kalt) ----------
	{
		id: 'omelette-salat',
		name: 'Omelette mit Salat',
		slot: 'znacht',
		ingredients: [
			g('Eier', { amountPerPerson: 100, dietClass: 'animalProduct', allergens: ['eier'], perishability: 'frisch_3_tage' }),
			g('Milch', { baseKey: 'milch', unit: 'ml', dietClass: 'animalProduct', allergens: ['milch'], perishability: 'frisch_3_tage' }),
			g('Blattsalat', { baseKey: 'salat', perishability: 'frisch_1_tag' }),
			g('Salatsauce', { amountPerPerson: 15, unit: 'ml', allergens: ['senf'], perishability: 'frisch_3_tage' }),
			g('Brot', { amountPerPerson: 60, allergens: ['gluten'] }),
			oil,
			salt
		],
		steps: [
			'Eier mit Milch verquirlen, würzen.',
			'Portionenweise zu Omeletten braten.',
			'Mit angemachtem Salat und Brot servieren.'
		],
		cooking: { kochstellen: 2, brauchtOfen: false, ruestBasisMin: 12, ruestProPortionMin: 0.5 }
	},
	{
		id: 'gemuesesuppe-brot',
		name: 'Gemüsesuppe mit Brot',
		slot: 'znacht',
		ingredients: [
			g('Suppengemüse', { baseKey: 'gemuese', allergens: ['sellerie'], perishability: 'frisch_3_tage' }),
			g('Kartoffeln', { baseKey: 'kartoffeln' }),
			g('Brot', { amountPerPerson: 70, allergens: ['gluten'] }),
			g('Reibkäse', { amountPerPerson: 15, dietClass: 'animalProduct', allergens: ['milch'], perishability: 'frisch_3_tage' }),
			bouillon,
			salt
		],
		steps: [
			'Gemüse und Kartoffeln würfeln.',
			'In Bouillon weich köcheln, teilweise pürieren.',
			'Mit Brot und Käse servieren.'
		],
		cooking: { kochstellen: 1, brauchtOfen: false, ruestBasisMin: 12, ruestProPortionMin: 0.3, volumenProPortionMl: 480 }
	},
	{
		id: 'hoernlisalat',
		name: 'Hörnlisalat (kalt)',
		slot: 'znacht',
		ingredients: [
			g('Hörnli', { baseKey: 'teigwaren', allergens: ['gluten'] }),
			g('Mais & Erbsen', { amountPerPerson: 50 }),
			g('Rüebli', { amountPerPerson: 40, perishability: 'frisch_3_tage' }),
			g('Käsewürfel', { amountPerPerson: 30, dietClass: 'animalProduct', allergens: ['milch'], perishability: 'frisch_3_tage' }),
			g('Salatsauce', { amountPerPerson: 20, unit: 'ml', allergens: ['senf'], perishability: 'frisch_3_tage' })
		],
		steps: [
			'Hörnli kochen, kalt abspülen, gut abtropfen.',
			'Mit Gemüse und Käse mischen.',
			'Mit Sauce anmachen und durchziehen lassen.'
		],
		cooking: { kochstellen: 1, brauchtOfen: false, ruestBasisMin: 15, ruestProPortionMin: 0.3 }
	},
	{
		id: 'gemuese-wraps',
		name: 'Gefüllte Wraps',
		slot: 'znacht',
		vegiVariante: true,
		ingredients: [
			g('Tortilla-Wraps', { amountPerPerson: 90, allergens: ['gluten'] }),
			g('Pouletstreifen', { baseKey: 'fleisch', dietClass: 'meat', perishability: 'frisch_1_tag' }),
			g('Bohnen-Mais-Mix (vegi)', { amountPerPerson: 60, dietClass: 'meatAlternative' }),
			g('Salat & Tomaten', { baseKey: 'salat', perishability: 'frisch_1_tag' }),
			g('Sauerrahm-Dip', { amountPerPerson: 25, dietClass: 'animalProduct', allergens: ['milch'], perishability: 'frisch_3_tage' }),
			oil,
			salt
		],
		steps: [
			'Poulet anbraten bzw. Bohnen-Mais erwärmen.',
			'Wraps mit Salat, Füllung und Dip belegen.',
			'Einrollen und servieren.'
		],
		cooking: { kochstellen: 1, brauchtOfen: false, ruestBasisMin: 12, ruestProPortionMin: 0.5 }
	},
	{
		id: 'kartoffelsalat-wuerstli',
		name: 'Kartoffelsalat mit Würstli',
		slot: 'znacht',
		vegiVariante: true,
		ingredients: [
			g('Kartoffeln', { baseKey: 'kartoffeln' }),
			g('Wienerli', { baseKey: 'fleisch', dietClass: 'meat', perishability: 'frisch_3_tage' }),
			g('Vegi-Würstli', { baseKey: 'fleischersatz', dietClass: 'meatAlternative', allergens: ['soja'], perishability: 'frisch_3_tage' }),
			g('Zwiebel', { amountPerPerson: 15 }),
			g('Salatsauce (Essig/Öl)', { amountPerPerson: 20, unit: 'ml', allergens: ['senf', 'sulfite'] }),
			bouillon
		],
		steps: [
			'Kartoffeln kochen, noch warm rüsten und mit warmer Bouillon-Sauce anmachen.',
			'Würstli erwärmen.',
			'Kartoffelsalat mit Würstli servieren.'
		],
		cooking: { kochstellen: 2, brauchtOfen: false, ruestBasisMin: 15, ruestProPortionMin: 0.4 }
	},

	// ---------- Zmorge ----------
	{
		id: 'overnight-oats',
		name: 'Overnight Oats',
		slot: 'zmorge',
		ingredients: [
			g('Haferflocken', { baseKey: 'mueesli', allergens: ['gluten'] }),
			g('Joghurt', { amountPerPerson: 120, dietClass: 'animalProduct', allergens: ['milch'], perishability: 'frisch_3_tage' }),
			g('Apfel', { amountPerPerson: 60, perishability: 'frisch_3_tage' }),
			g('Haselnüsse', { amountPerPerson: 10, allergens: ['schalenfruechte'] }),
			g('Zitrone & Honig', { amountPerPerson: 10 })
		],
		steps: [
			'Haferflocken mit Joghurt anrühren, kurz quellen lassen.',
			'Apfel dazureiben, mit Zitrone und Honig abschmecken.',
			'Mit Nüssen bestreuen.'
		],
		cooking: { kochstellen: 0, brauchtOfen: false, ruestBasisMin: 10, ruestProPortionMin: 0.3 }
	},
	{
		id: 'haferbrei-frucht',
		name: 'Haferbrei mit Früchten',
		slot: 'zmorge',
		ingredients: [
			g('Haferflocken', { baseKey: 'mueesli', allergens: ['gluten'] }),
			g('Milch', { baseKey: 'milch', unit: 'ml', dietClass: 'animalProduct', allergens: ['milch'], perishability: 'frisch_3_tage' }),
			g('Banane & Beeren', { amountPerPerson: 60, perishability: 'frisch_3_tage' }),
			g('Zimt & Zucker', { amountPerPerson: 8, kesselClass: 'gewuerz' })
		],
		steps: [
			'Haferflocken in Milch aufkochen und quellen lassen.',
			'Mit Zimt und Zucker abschmecken.',
			'Mit Früchten servieren.'
		],
		cooking: { kochstellen: 1, brauchtOfen: false, ruestBasisMin: 8, ruestProPortionMin: 0.3, volumenProPortionMl: 300 }
	},
	{
		id: 'zopf-konfi',
		name: 'Zopf mit Konfitüre',
		slot: 'zmorge',
		ingredients: [
			g('Zopf', { amountPerPerson: 90, allergens: ['gluten', 'eier', 'milch'] }),
			g('Butter', { baseKey: 'butter', dietClass: 'animalProduct', allergens: ['milch'], perishability: 'frisch_3_tage' }),
			g('Konfitüre', { baseKey: 'konfi', allergens: ['sulfite'] }),
			g('Käse & Aufschnitt', { baseKey: 'aufschnitt', dietClass: 'animalProduct', allergens: ['milch'], perishability: 'frisch_3_tage' })
		],
		steps: ['Zopf aufschneiden.', 'Butter, Konfitüre, Käse und Aufschnitt bereitstellen.', 'Mit Kaffee/Tee servieren.'],
		cooking: { kochstellen: 0, brauchtOfen: false, ruestBasisMin: 10, ruestProPortionMin: 0.2 }
	},

	// ---------- Zvieri ----------
	{
		id: 'rohkost-dip',
		name: 'Rohkost mit Dip',
		slot: 'zvieri',
		ingredients: [
			g('Rüebli & Gurke', { baseKey: 'gemuese', perishability: 'frisch_3_tage' }),
			g('Kräuterquark-Dip', { amountPerPerson: 30, dietClass: 'animalProduct', allergens: ['milch'], perishability: 'frisch_3_tage' })
		],
		steps: ['Gemüse in Sticks schneiden.', 'Dip anrühren.', 'Zusammen anrichten.'],
		cooking: { kochstellen: 0, brauchtOfen: false, ruestBasisMin: 10, ruestProPortionMin: 0.3 }
	},
	{
		id: 'studentenfutter',
		name: 'Studentenfutter & Apfel',
		slot: 'zvieri',
		ingredients: [
			g('Nüsse & Rosinen', { amountPerPerson: 30, allergens: ['schalenfruechte', 'sulfite'] }),
			g('Apfel', { baseKey: 'frucht', perishability: 'frisch_3_tage' })
		],
		steps: ['Studentenfutter portionieren.', 'Mit einem Apfel servieren.'],
		cooking: { kochstellen: 0, brauchtOfen: false, ruestBasisMin: 5, ruestProPortionMin: 0.1 }
	},

	// ---------- Dessert ----------
	{
		id: 'schoggimousse',
		name: 'Schoggimousse',
		slot: 'dessert',
		ingredients: [
			g('Schokolade', { amountPerPerson: 30, dietClass: 'animalProduct', allergens: ['milch', 'soja'] }),
			g('Rahm', { amountPerPerson: 60, unit: 'ml', dietClass: 'animalProduct', allergens: ['milch'], perishability: 'frisch_3_tage' }),
			g('Eier', { amountPerPerson: 40, dietClass: 'animalProduct', allergens: ['eier'], perishability: 'frisch_3_tage' })
		],
		steps: ['Schokolade schmelzen.', 'Rahm und Eischnee unterheben.', 'Kalt stellen und servieren.'],
		cooking: { kochstellen: 1, brauchtOfen: false, ruestBasisMin: 15, ruestProPortionMin: 0.4 }
	},
	{
		id: 'fruchtquark',
		name: 'Fruchtquark',
		slot: 'dessert',
		ingredients: [
			g('Quark', { amountPerPerson: 100, dietClass: 'animalProduct', allergens: ['milch'], perishability: 'frisch_3_tage' }),
			g('Beeren/Früchte', { baseKey: 'frucht', perishability: 'frisch_3_tage' }),
			g('Zucker', { amountPerPerson: 8 })
		],
		steps: ['Quark mit Zucker verrühren.', 'Früchte untermischen.', 'Kühl servieren.'],
		cooking: { kochstellen: 0, brauchtOfen: false, ruestBasisMin: 8, ruestProPortionMin: 0.2 }
	},
	{
		id: 'griessbrei-beeren',
		name: 'Griessbrei mit Beeren',
		slot: 'dessert',
		ingredients: [
			g('Hartweizengriess', { amountPerPerson: 40, allergens: ['gluten'] }),
			g('Milch', { baseKey: 'milch', unit: 'ml', dietClass: 'animalProduct', allergens: ['milch'], perishability: 'frisch_3_tage' }),
			g('Zucker & Vanille', { amountPerPerson: 10, kesselClass: 'gewuerz' }),
			g('Beeren', { baseKey: 'frucht', perishability: 'frisch_3_tage' })
		],
		steps: ['Milch aufkochen, Griess einrühren.', 'Quellen lassen, süssen.', 'Mit Beeren servieren.'],
		cooking: { kochstellen: 1, brauchtOfen: false, ruestBasisMin: 8, ruestProPortionMin: 0.3, volumenProPortionMl: 250 }
	}
];
