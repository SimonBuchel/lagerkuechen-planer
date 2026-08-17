/**
 * Additional recipes, bringing the collection to the Definition-of-Done target
 * of 60 (Kapitel 11). Same rules as `data.ts`: every ingredient allergen-tagged,
 * preparation steps written from scratch (Kapitel 8).
 */

import type { Recipe } from './types';

const g = (
	name: string,
	opts: Partial<Recipe['ingredients'][number]> & {
		baseKey?: string;
		amountPerPerson?: number;
	}
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

export const EXTRA_RECIPES: readonly Recipe[] = [
	// ---------- Zmittag ----------
	{
		id: 'ghackets-hoernli',
		name: 'Ghackets und Hörnli',
		slot: 'zmittag',
		vegiVariante: true,
		ingredients: [
			g('Hörnli', { baseKey: 'teigwaren', allergens: ['gluten'] }),
			g('Hackfleisch', { baseKey: 'hack', dietClass: 'meat', perishability: 'frisch_1_tag' }),
			g('Sojagranulat (vegi)', {
				amountPerPerson: 25,
				dietClass: 'meatAlternative',
				allergens: ['soja']
			}),
			g('Zwiebel', { amountPerPerson: 15 }),
			g('Bouillon', { amountPerPerson: 3, allergens: ['sellerie'], kesselClass: 'gewuerz' }),
			salt
		],
		steps: [
			'Hackfleisch bzw. Soja mit Zwiebel anbraten und würzen.',
			'Hörnli kochen.',
			'Mit Apfelmus servieren.'
		],
		cooking: {
			kochstellen: 2,
			brauchtOfen: false,
			ruestBasisMin: 15,
			ruestProPortionMin: 0.4,
			volumenProPortionMl: 520
		}
	},
	{
		id: 'poulet-geschnetzeltes',
		name: 'Geschnetzeltes mit Reis',
		slot: 'zmittag',
		vegiVariante: true,
		ingredients: [
			g('Pouletbrust', { baseKey: 'fleisch', dietClass: 'meat', perishability: 'frisch_1_tag' }),
			g('Quorn/Tofu (vegi)', {
				baseKey: 'fleischersatz',
				dietClass: 'meatAlternative',
				allergens: ['soja'],
				perishability: 'frisch_3_tage'
			}),
			g('Reis', { baseKey: 'reis' }),
			g('Rahm', {
				amountPerPerson: 40,
				unit: 'ml',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			}),
			g('Champignons', { amountPerPerson: 60, perishability: 'frisch_3_tage' }),
			oil,
			salt
		],
		steps: [
			'Fleisch bzw. Ersatz kurz anbraten, herausnehmen.',
			'Champignons dünsten, mit Rahm zur Sauce, Fleisch zurückgeben.',
			'Mit Reis servieren.'
		],
		cooking: {
			kochstellen: 2,
			brauchtOfen: false,
			ruestBasisMin: 20,
			ruestProPortionMin: 0.5,
			volumenProPortionMl: 400
		}
	},
	{
		id: 'spaghetti-carbonara',
		name: 'Spaghetti Carbonara',
		slot: 'zmittag',
		vegiVariante: true,
		ingredients: [
			g('Spaghetti', { baseKey: 'teigwaren', allergens: ['gluten'] }),
			g('Speckwürfeli', { amountPerPerson: 40, dietClass: 'meat', perishability: 'frisch_3_tage' }),
			g('Ei', {
				amountPerPerson: 0.7,
				unit: 'stk',
				dietClass: 'animalProduct',
				allergens: ['eier'],
				perishability: 'frisch_3_tage'
			}),
			g('Reibkäse', {
				baseKey: 'kaese',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			}),
			salt
		],
		steps: [
			'Speck knusprig braten (vegi: weglassen).',
			'Ei mit Käse verquirlen.',
			'Heisse Pasta abseits der Hitze mit der Eimasse mischen.'
		],
		cooking: {
			kochstellen: 2,
			brauchtOfen: false,
			ruestBasisMin: 15,
			ruestProPortionMin: 0.4,
			volumenProPortionMl: 520
		}
	},
	{
		id: 'gnocchi-tomate',
		name: 'Gnocchi an Tomatensauce',
		slot: 'zmittag',
		vegiVariante: true,
		ingredients: [
			g('Gnocchi', { amountPerPerson: 250, allergens: ['gluten'], perishability: 'frisch_3_tage' }),
			g('Pelati (Dosentomaten)', { amountPerPerson: 120 }),
			g('Reibkäse', {
				baseKey: 'kaese',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			}),
			g('Kräuter', { amountPerPerson: 1, kesselClass: 'gewuerz' }),
			salt
		],
		steps: [
			'Tomatensauce würzen und köcheln.',
			'Gnocchi in Salzwasser ziehen lassen, bis sie aufsteigen.',
			'Mit Sauce und Käse servieren.'
		],
		cooking: {
			kochstellen: 2,
			brauchtOfen: false,
			ruestBasisMin: 15,
			ruestProPortionMin: 0.3,
			volumenProPortionMl: 450
		}
	},
	{
		id: 'polenta-gemuese',
		name: 'Polenta mit Schmorgemüse',
		slot: 'zmittag',
		vegiVariante: true,
		ingredients: [
			g('Polenta (Maisgriess)', { amountPerPerson: 90 }),
			g('Saisongemüse', { baseKey: 'gemuese', perishability: 'frisch_3_tage' }),
			g('Bouillon', { amountPerPerson: 4, allergens: ['sellerie'], kesselClass: 'gewuerz' }),
			g('Butter', {
				baseKey: 'butter',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			}),
			salt
		],
		steps: [
			'Polenta in Bouillon unter Rühren garen, mit Butter verfeinern.',
			'Gemüse schmoren.',
			'Zusammen anrichten.'
		],
		cooking: {
			kochstellen: 2,
			brauchtOfen: false,
			ruestBasisMin: 15,
			ruestProPortionMin: 0.5,
			volumenProPortionMl: 400
		}
	},
	{
		id: 'couscous-gemuese',
		name: 'Couscous-Gemüsepfanne',
		slot: 'zmittag',
		vegiVariante: true,
		ingredients: [
			g('Couscous', { amountPerPerson: 100, allergens: ['gluten'] }),
			g('Saisongemüse', { baseKey: 'gemuese', perishability: 'frisch_3_tage' }),
			g('Kichererbsen', { amountPerPerson: 60 }),
			g('Bouillon', { amountPerPerson: 4, allergens: ['sellerie'], kesselClass: 'gewuerz' }),
			oil,
			salt
		],
		steps: [
			'Couscous mit heisser Bouillon quellen lassen.',
			'Gemüse und Kichererbsen anbraten.',
			'Untermischen; vegan.'
		],
		cooking: {
			kochstellen: 1,
			brauchtOfen: false,
			ruestBasisMin: 15,
			ruestProPortionMin: 0.4,
			volumenProPortionMl: 350
		}
	},
	{
		id: 'minestrone',
		name: 'Minestrone mit Brot',
		slot: 'zmittag',
		vegiVariante: true,
		ingredients: [
			g('Suppengemüse', { baseKey: 'gemuese', perishability: 'frisch_3_tage' }),
			g('Kartoffeln', { amountPerPerson: 80, perishability: 'frisch_3_tage' }),
			g('Teigwaren klein', { amountPerPerson: 30, allergens: ['gluten'] }),
			g('Bohnen', { amountPerPerson: 50 }),
			g('Bouillon', { amountPerPerson: 5, allergens: ['sellerie'], kesselClass: 'gewuerz' }),
			g('Brot', { baseKey: 'brot-znacht', allergens: ['gluten'], perishability: 'frisch_1_tag' })
		],
		steps: [
			'Gemüse und Kartoffeln in Bouillon garen.',
			'Teigwaren und Bohnen mitkochen.',
			'Mit Brot servieren.'
		],
		cooking: {
			kochstellen: 1,
			brauchtOfen: false,
			ruestBasisMin: 20,
			ruestProPortionMin: 0.5,
			volumenProPortionMl: 450
		}
	},
	{
		id: 'linseneintopf',
		name: 'Linseneintopf',
		slot: 'zmittag',
		vegiVariante: true,
		ingredients: [
			g('Linsen', { amountPerPerson: 90 }),
			g('Rüebli & Sellerie', {
				amountPerPerson: 120,
				allergens: ['sellerie'],
				perishability: 'frisch_3_tage'
			}),
			g('Wienerli (optional)', {
				baseKey: 'aufschnitt',
				dietClass: 'meat',
				perishability: 'frisch_3_tage'
			}),
			g('Bouillon', { amountPerPerson: 4, allergens: ['sellerie'], kesselClass: 'gewuerz' }),
			salt
		],
		steps: [
			'Linsen mit Gemüse in Bouillon weich kochen.',
			'Wienerli separat erwärmen (vegi: weglassen).',
			'Abschmecken.'
		],
		cooking: {
			kochstellen: 1,
			brauchtOfen: false,
			ruestBasisMin: 15,
			ruestProPortionMin: 0.4,
			volumenProPortionMl: 450
		}
	},
	{
		id: 'pizza-blech',
		name: 'Blechpizza',
		slot: 'zmittag',
		vegiVariante: true,
		ingredients: [
			g('Pizzateig', {
				amountPerPerson: 120,
				allergens: ['gluten'],
				perishability: 'frisch_3_tage'
			}),
			g('Tomatensauce', { amountPerPerson: 60 }),
			g('Mozzarella', {
				baseKey: 'kaese',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			}),
			g('Belag (Gemüse/Schinken)', { amountPerPerson: 60, perishability: 'frisch_3_tage' })
		],
		steps: [
			'Teig auf geölte Bleche ausziehen.',
			'Sauce, Käse und Belag verteilen.',
			'Bei 230 °C ca. 15 Min. backen.'
		],
		cooking: { kochstellen: 0, brauchtOfen: true, ruestBasisMin: 35, ruestProPortionMin: 0.5 }
	},
	{
		id: 'fischstaebli-stock',
		name: 'Fischstäbli mit Kartoffelstock',
		slot: 'zmittag',
		vegiVariante: true,
		ingredients: [
			g('Fischstäbchen', {
				amountPerPerson: 120,
				dietClass: 'fish',
				allergens: ['fische', 'gluten'],
				perishability: 'frisch_1_tag'
			}),
			g('Gemüsestäbchen (vegi)', {
				amountPerPerson: 120,
				dietClass: 'meatAlternative',
				allergens: ['gluten'],
				perishability: 'frisch_3_tage'
			}),
			g('Kartoffeln', { baseKey: 'kartoffeln', perishability: 'frisch_3_tage' }),
			g('Milch', {
				amountPerPerson: 60,
				unit: 'ml',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			}),
			g('Butter', {
				baseKey: 'butter',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			})
		],
		steps: [
			'Kartoffelstock mit Milch und Butter zubereiten.',
			'Fischstäbchen im Ofen knusprig backen.',
			'Mit Zitrone servieren.'
		],
		cooking: {
			kochstellen: 1,
			brauchtOfen: true,
			ruestBasisMin: 25,
			ruestProPortionMin: 0.5,
			volumenProPortionMl: 350
		}
	},
	{
		id: 'hackbraten',
		name: 'Hackbraten mit Kartoffeln',
		slot: 'zmittag',
		ingredients: [
			g('Hackfleisch', { baseKey: 'hack', dietClass: 'meat', perishability: 'frisch_1_tag' }),
			g('Ei', {
				amountPerPerson: 0.3,
				unit: 'stk',
				dietClass: 'animalProduct',
				allergens: ['eier'],
				perishability: 'frisch_3_tage'
			}),
			g('Paniermehl', { amountPerPerson: 15, allergens: ['gluten'] }),
			g('Kartoffeln', { baseKey: 'kartoffeln', perishability: 'frisch_3_tage' }),
			salt
		],
		steps: [
			'Hack mit Ei und Paniermehl mischen, würzen, zu Laiben formen.',
			'Bei 180 °C ca. 50 Min. backen.',
			'Mit Ofenkartoffeln servieren.'
		],
		cooking: { kochstellen: 1, brauchtOfen: true, ruestBasisMin: 30, ruestProPortionMin: 0.5 }
	},
	{
		id: 'gefuellte-peperoni',
		name: 'Gefüllte Peperoni',
		slot: 'zmittag',
		vegiVariante: true,
		ingredients: [
			g('Peperoni', { amountPerPerson: 200, perishability: 'frisch_3_tage' }),
			g('Reis', { baseKey: 'reis' }),
			g('Hackfleisch', { baseKey: 'hack', dietClass: 'meat', perishability: 'frisch_1_tag' }),
			g('Sojagranulat (vegi)', {
				amountPerPerson: 25,
				dietClass: 'meatAlternative',
				allergens: ['soja']
			}),
			g('Reibkäse', {
				baseKey: 'kaese',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			})
		],
		steps: [
			'Reis mit Hack bzw. Soja mischen und würzen.',
			'Peperoni füllen, mit Käse bestreuen.',
			'Bei 190 °C ca. 35 Min. backen.'
		],
		cooking: { kochstellen: 1, brauchtOfen: true, ruestBasisMin: 30, ruestProPortionMin: 0.7 }
	},
	{
		id: 'kartoffelwedges-quark',
		name: 'Ofen-Wedges mit Kräuterquark',
		slot: 'zmittag',
		vegiVariante: true,
		ingredients: [
			g('Kartoffeln', { baseKey: 'kartoffeln', perishability: 'frisch_3_tage' }),
			g('Kräuterquark', {
				amountPerPerson: 80,
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			}),
			oil,
			salt
		],
		steps: [
			'Kartoffelspalten mit Öl und Salz mischen, bei 210 °C backen.',
			'Quark mit Kräutern anrühren.',
			'Dazu Rohkost.'
		],
		cooking: { kochstellen: 0, brauchtOfen: true, ruestBasisMin: 20, ruestProPortionMin: 0.4 }
	},
	{
		id: 'gemuese-eintopf',
		name: 'Bunter Gemüse-Eintopf',
		slot: 'zmittag',
		vegiVariante: true,
		ingredients: [
			g('Kartoffeln', { amountPerPerson: 120, perishability: 'frisch_3_tage' }),
			g('Saisongemüse', { baseKey: 'gemuese', perishability: 'frisch_3_tage' }),
			g('Bohnen', { amountPerPerson: 50 }),
			g('Bouillon', { amountPerPerson: 5, allergens: ['sellerie'], kesselClass: 'gewuerz' })
		],
		steps: ['Alles würfeln und in Bouillon garen.', 'Abschmecken; vegan.'],
		cooking: {
			kochstellen: 1,
			brauchtOfen: false,
			ruestBasisMin: 15,
			ruestProPortionMin: 0.5,
			volumenProPortionMl: 450
		}
	},
	{
		id: 'wurstsalat',
		name: 'Wurst-Käse-Salat (kalt)',
		slot: 'zmittag',
		ingredients: [
			g('Fleischkäse/Wurst', {
				baseKey: 'aufschnitt',
				dietClass: 'meat',
				perishability: 'frisch_1_tag'
			}),
			g('Käse', {
				baseKey: 'kaese',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			}),
			g('Essiggurken & Zwiebel', { amountPerPerson: 40 }),
			g('Salatsauce (Öl, Essig, Senf)', {
				amountPerPerson: 20,
				unit: 'ml',
				allergens: ['senf', 'sulfite']
			}),
			g('Brot', { baseKey: 'brot-znacht', allergens: ['gluten'], perishability: 'frisch_1_tag' })
		],
		steps: [
			'Wurst und Käse in Streifen schneiden.',
			'Mit Gurken, Zwiebel und Sauce mischen.',
			'Kühl mit Brot servieren.'
		],
		cooking: { kochstellen: 0, brauchtOfen: false, ruestBasisMin: 20, ruestProPortionMin: 0.4 }
	},
	// ---------- Znacht ----------
	{
		id: 'raclette',
		name: 'Raclette',
		slot: 'znacht',
		ingredients: [
			g('Raclettekäse', {
				amountPerPerson: 200,
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			}),
			g('Kartoffeln', { baseKey: 'kartoffeln', perishability: 'frisch_3_tage' }),
			g('Gemüse & Gurken', { amountPerPerson: 80, perishability: 'frisch_3_tage' })
		],
		steps: ['Kartoffeln kochen.', 'Käse im Öfeli schmelzen.', 'Mit Gemüse und Gewürzen servieren.'],
		cooking: { kochstellen: 1, brauchtOfen: false, ruestBasisMin: 20, ruestProPortionMin: 0.3 }
	},
	{
		id: 'hotdog',
		name: 'Hot Dog',
		slot: 'znacht',
		vegiVariante: true,
		ingredients: [
			g('Hot-Dog-Brötchen', {
				amountPerPerson: 1.2,
				unit: 'stk',
				allergens: ['gluten'],
				perishability: 'frisch_1_tag'
			}),
			g('Wienerli', { baseKey: 'fleisch', dietClass: 'meat', perishability: 'frisch_3_tage' }),
			g('Gemüsewürstchen (vegi)', {
				baseKey: 'fleischersatz',
				dietClass: 'meatAlternative',
				allergens: ['gluten', 'soja'],
				perishability: 'frisch_3_tage'
			}),
			g('Senf & Ketchup', { amountPerPerson: 15, allergens: ['senf'] }),
			g('Röstzwiebeln', { amountPerPerson: 8, allergens: ['gluten'] })
		],
		steps: [
			'Würstli heiss ziehen (Fleisch/vegi getrennt).',
			'Brötchen aufschneiden, füllen, garnieren.'
		],
		cooking: {
			kochstellen: 1,
			brauchtOfen: false,
			ruestBasisMin: 15,
			ruestProPortionMin: 0.2,
			volumenProPortionMl: 200
		}
	},
	{
		id: 'flammkuchen',
		name: 'Flammkuchen',
		slot: 'znacht',
		vegiVariante: true,
		ingredients: [
			g('Flammkuchenteig', {
				amountPerPerson: 100,
				allergens: ['gluten'],
				perishability: 'frisch_3_tage'
			}),
			g('Sauerrahm', {
				amountPerPerson: 50,
				unit: 'ml',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			}),
			g('Speck & Zwiebel', {
				amountPerPerson: 40,
				dietClass: 'meat',
				perishability: 'frisch_3_tage'
			})
		],
		steps: [
			'Teig dünn ausrollen, mit Sauerrahm bestreichen.',
			'Zwiebel und Speck (vegi: nur Gemüse) verteilen.',
			'Bei 240 °C knusprig backen.'
		],
		cooking: { kochstellen: 0, brauchtOfen: true, ruestBasisMin: 30, ruestProPortionMin: 0.4 }
	},
	{
		id: 'kaesespaetzli',
		name: 'Chässpätzli',
		slot: 'znacht',
		ingredients: [
			g('Spätzli', {
				amountPerPerson: 200,
				allergens: ['gluten', 'eier'],
				perishability: 'frisch_3_tage'
			}),
			g('Reibkäse', {
				baseKey: 'kaese',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			}),
			g('Röstzwiebeln', { amountPerPerson: 10, allergens: ['gluten'] }),
			g('Butter', {
				baseKey: 'butter',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			})
		],
		steps: [
			'Spätzli heiss mit Käse schichten, bis er schmilzt.',
			'Röstzwiebeln darüber.',
			'Dazu Apfelmus oder Salat.'
		],
		cooking: {
			kochstellen: 2,
			brauchtOfen: false,
			ruestBasisMin: 20,
			ruestProPortionMin: 0.4,
			volumenProPortionMl: 500
		}
	},
	{
		id: 'wraps',
		name: 'Gefüllte Wraps',
		slot: 'znacht',
		vegiVariante: true,
		ingredients: [
			g('Tortilla-Wraps', {
				amountPerPerson: 2,
				unit: 'stk',
				allergens: ['gluten'],
				perishability: 'lagerfaehig'
			}),
			g('Poulet/Bohnen', { amountPerPerson: 80, dietClass: 'meat', perishability: 'frisch_1_tag' }),
			g('Gemüse & Salat', { amountPerPerson: 80, perishability: 'frisch_3_tage' }),
			g('Sauce (Joghurt)', {
				amountPerPerson: 30,
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			})
		],
		steps: ['Füllung vorbereiten (Fleisch oder Bohnen).', 'Wraps belegen und rollen.'],
		cooking: { kochstellen: 1, brauchtOfen: false, ruestBasisMin: 20, ruestProPortionMin: 0.5 }
	},
	{
		id: 'gemuese-omelette',
		name: 'Omelette mit Gemüse',
		slot: 'znacht',
		ingredients: [
			g('Eier', {
				amountPerPerson: 2,
				unit: 'stk',
				dietClass: 'animalProduct',
				allergens: ['eier'],
				perishability: 'frisch_3_tage'
			}),
			g('Milch', {
				amountPerPerson: 30,
				unit: 'ml',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			}),
			g('Gemüse', { amountPerPerson: 100, perishability: 'frisch_3_tage' }),
			g('Brot', { baseKey: 'brot-znacht', allergens: ['gluten'], perishability: 'frisch_1_tag' }),
			oil
		],
		steps: [
			'Eier mit Milch verquirlen, würzen.',
			'Gemüse andünsten, Eimasse dazugeben, stocken lassen.',
			'Mit Brot servieren.'
		],
		cooking: { kochstellen: 2, brauchtOfen: false, ruestBasisMin: 15, ruestProPortionMin: 0.4 }
	},
	{
		id: 'suppe-wuerstli',
		name: 'Suppe mit Wienerli',
		slot: 'znacht',
		ingredients: [
			g('Suppe', { baseKey: 'suppe', allergens: ['sellerie'], kesselClass: 'gewuerz' }),
			g('Wienerli', { baseKey: 'fleisch', dietClass: 'meat', perishability: 'frisch_3_tage' }),
			g('Brot', { baseKey: 'brot-znacht', allergens: ['gluten'], perishability: 'frisch_1_tag' })
		],
		steps: ['Suppe aufkochen.', 'Wienerli darin heiss ziehen lassen.', 'Mit Brot servieren.'],
		cooking: {
			kochstellen: 1,
			brauchtOfen: false,
			ruestBasisMin: 10,
			ruestProPortionMin: 0.2,
			volumenProPortionMl: 350
		}
	},
	{
		id: 'pizzabroetli',
		name: 'Pizzabrötli',
		slot: 'znacht',
		vegiVariante: true,
		ingredients: [
			g('Brötli', {
				amountPerPerson: 1.5,
				unit: 'stk',
				allergens: ['gluten'],
				perishability: 'frisch_1_tag'
			}),
			g('Tomatensauce', { amountPerPerson: 40 }),
			g('Reibkäse', {
				baseKey: 'kaese',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			})
		],
		steps: ['Brötli halbieren, mit Sauce und Käse belegen.', 'Kurz überbacken.'],
		cooking: { kochstellen: 0, brauchtOfen: true, ruestBasisMin: 15, ruestProPortionMin: 0.3 }
	},
	{
		id: 'znacht-znueni-teller',
		name: 'Apéro-Znacht (kalte Platte)',
		slot: 'znacht',
		ingredients: [
			g('Brot', { baseKey: 'brot-znacht', allergens: ['gluten'], perishability: 'frisch_1_tag' }),
			g('Käse', {
				baseKey: 'kaese',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			}),
			g('Trockenfleisch', {
				baseKey: 'aufschnitt',
				dietClass: 'meat',
				perishability: 'frisch_3_tage'
			}),
			g('Oliven & Gemüse', { amountPerPerson: 60, perishability: 'frisch_3_tage' })
		],
		steps: ['Alles mundgerecht schneiden und anrichten.', 'Vegetarische Aufstriche dazu.'],
		cooking: { kochstellen: 0, brauchtOfen: false, ruestBasisMin: 20, ruestProPortionMin: 0.3 }
	},
	// ---------- Zmorge ----------
	{
		id: 'zopf-brunch',
		name: 'Zopf-Brunch',
		slot: 'zmorge',
		ingredients: [
			g('Zopf', {
				amountPerPerson: 100,
				allergens: ['gluten', 'milch', 'eier'],
				perishability: 'frisch_1_tag'
			}),
			g('Butter', {
				baseKey: 'butter',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			}),
			g('Konfitüre & Honig', { baseKey: 'konfi' }),
			g('Käse & Aufschnitt', {
				baseKey: 'kaese',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			})
		],
		steps: ['Zopf schneiden, Aufstriche bereitstellen.', 'Tee und Kaffee kochen.'],
		cooking: { kochstellen: 1, brauchtOfen: false, ruestBasisMin: 20, ruestProPortionMin: 0.3 }
	},
	{
		id: 'griessbrei',
		name: 'Griessbrei',
		slot: 'zmorge',
		ingredients: [
			g('Griess', { amountPerPerson: 60, allergens: ['gluten'] }),
			g('Milch', {
				baseKey: 'milch',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			}),
			g('Zucker & Zimt', { amountPerPerson: 12 })
		],
		steps: [
			'Milch aufkochen, Griess einrühren, quellen lassen.',
			'Mit Zimtzucker servieren (pflanzlich mit Hafermilch).'
		],
		cooking: {
			kochstellen: 1,
			brauchtOfen: false,
			ruestBasisMin: 10,
			ruestProPortionMin: 0.2,
			volumenProPortionMl: 280
		}
	},
	{
		id: 'porridge',
		name: 'Porridge',
		slot: 'zmorge',
		ingredients: [
			g('Haferflocken', { baseKey: 'mueesli', allergens: ['gluten'] }),
			g('Milch', {
				amountPerPerson: 200,
				unit: 'ml',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			}),
			g('Apfel & Zimt', { amountPerPerson: 60, perishability: 'frisch_3_tage' })
		],
		steps: [
			'Haferflocken in Milch weich köcheln.',
			'Mit Apfel und Zimt toppen (vegan mit Pflanzendrink).'
		],
		cooking: {
			kochstellen: 1,
			brauchtOfen: false,
			ruestBasisMin: 10,
			ruestProPortionMin: 0.2,
			volumenProPortionMl: 260
		}
	},
	{
		id: 'ruehrei-speck',
		name: 'Rührei mit Speck',
		slot: 'zmorge',
		ingredients: [
			g('Eier', {
				amountPerPerson: 2,
				unit: 'stk',
				dietClass: 'animalProduct',
				allergens: ['eier'],
				perishability: 'frisch_3_tage'
			}),
			g('Speck', { amountPerPerson: 30, dietClass: 'meat', perishability: 'frisch_3_tage' }),
			g('Brot', { baseKey: 'brot-zmorge', allergens: ['gluten'], perishability: 'frisch_1_tag' }),
			g('Butter', {
				baseKey: 'butter',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage',
				kesselClass: 'bratfett'
			})
		],
		steps: [
			'Speck knusprig braten (vegi: weglassen).',
			'Verquirlte Eier stocken lassen.',
			'Mit Brot servieren.'
		],
		cooking: { kochstellen: 2, brauchtOfen: false, ruestBasisMin: 15, ruestProPortionMin: 0.3 }
	},
	// ---------- Zvieri ----------
	{
		id: 'zvieri-fruechte-nuesse',
		name: 'Zvieri: Früchte & Nüsse',
		slot: 'zvieri',
		ingredients: [
			g('Frucht', { baseKey: 'frucht', unit: 'stk', perishability: 'frisch_3_tage' }),
			g('Studentenfutter', { amountPerPerson: 30, allergens: ['schalenfruechte'] })
		],
		steps: ['Früchte und Nussmischung bereitstellen.'],
		cooking: { kochstellen: 0, brauchtOfen: false, ruestBasisMin: 8, ruestProPortionMin: 0.1 }
	},
	{
		id: 'cake-zvieri',
		name: 'Zvieri-Cake',
		slot: 'zvieri',
		ingredients: [
			g('Cake (Mehl, Ei, Butter, Zucker)', {
				amountPerPerson: 80,
				allergens: ['gluten', 'eier', 'milch'],
				perishability: 'frisch_3_tage'
			}),
			g('Frucht', { baseKey: 'frucht', unit: 'stk', perishability: 'frisch_3_tage' })
		],
		steps: ['Cake in Scheiben schneiden.', 'Mit Früchten servieren.'],
		cooking: { kochstellen: 0, brauchtOfen: false, ruestBasisMin: 10, ruestProPortionMin: 0.2 }
	},
	{
		id: 'joghurt-zvieri',
		name: 'Joghurt mit Müesli',
		slot: 'zvieri',
		ingredients: [
			g('Joghurt', {
				amountPerPerson: 150,
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			}),
			g('Müesli', { baseKey: 'mueesli', allergens: ['gluten', 'schalenfruechte'] })
		],
		steps: ['Joghurt mit Müesli anbieten (laktosefreie/pflanzliche Variante bereitstellen).'],
		cooking: { kochstellen: 0, brauchtOfen: false, ruestBasisMin: 8, ruestProPortionMin: 0.1 }
	},
	{
		id: 'gemuesesticks-dip',
		name: 'Gemüsesticks mit Dip',
		slot: 'zvieri',
		ingredients: [
			g('Rohkost', { amountPerPerson: 120, perishability: 'frisch_3_tage' }),
			g('Quark-Dip', {
				amountPerPerson: 60,
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			})
		],
		steps: ['Gemüse in Sticks schneiden.', 'Dip anrühren (vegan mit Pflanzenquark).'],
		cooking: { kochstellen: 0, brauchtOfen: false, ruestBasisMin: 15, ruestProPortionMin: 0.4 }
	},
	// ---------- Dessert ----------
	{
		id: 'vanillecreme',
		name: 'Vanillecreme',
		slot: 'dessert',
		ingredients: [
			g('Milch', {
				amountPerPerson: 150,
				unit: 'ml',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			}),
			g('Vanillepuddingpulver', { amountPerPerson: 20 }),
			g('Zucker', { amountPerPerson: 15 })
		],
		steps: ['Pulver anrühren, Milch mit Zucker aufkochen, einrühren.', 'Kühl stellen.'],
		cooking: {
			kochstellen: 1,
			brauchtOfen: false,
			ruestBasisMin: 10,
			ruestProPortionMin: 0.2,
			volumenProPortionMl: 170
		}
	},
	{
		id: 'apfelmus-dessert',
		name: 'Warmes Apfelmus mit Guetzli',
		slot: 'dessert',
		ingredients: [
			g('Äpfel', { amountPerPerson: 180, perishability: 'frisch_3_tage' }),
			g('Zucker & Zimt', { amountPerPerson: 12 }),
			g('Guetzli', { amountPerPerson: 20, allergens: ['gluten', 'milch'] })
		],
		steps: ['Äpfel weich kochen und stampfen, zuckern.', 'Mit Guetzli servieren; vegan möglich.'],
		cooking: {
			kochstellen: 1,
			brauchtOfen: false,
			ruestBasisMin: 15,
			ruestProPortionMin: 0.4,
			volumenProPortionMl: 200
		}
	},
	{
		id: 'coupe-glace',
		name: 'Coupe (Glace mit Früchten)',
		slot: 'dessert',
		ingredients: [
			g('Glace', {
				amountPerPerson: 100,
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_1_tag'
			}),
			g('Früchte', { amountPerPerson: 80, perishability: 'frisch_3_tage' }),
			g('Rahmbläs', {
				amountPerPerson: 15,
				unit: 'ml',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			})
		],
		steps: ['Glace in Becher, Früchte darüber.', 'Mit Rahm garnieren (Sorbet als vegane Option).'],
		cooking: { kochstellen: 0, brauchtOfen: false, ruestBasisMin: 10, ruestProPortionMin: 0.3 }
	},
	{
		id: 'schoggibananen',
		name: 'Schoggibananen (Lagerfeuer)',
		slot: 'dessert',
		ingredients: [
			g('Bananen', { amountPerPerson: 1, unit: 'stk', perishability: 'frisch_3_tage' }),
			g('Schokolade', {
				amountPerPerson: 30,
				dietClass: 'animalProduct',
				allergens: ['milch', 'soja'],
				perishability: 'lagerfaehig'
			})
		],
		steps: [
			'Banane längs einschneiden, mit Schoggi füllen.',
			'In Folie ins Glut legen, bis die Schokolade schmilzt.'
		],
		cooking: { kochstellen: 0, brauchtOfen: false, ruestBasisMin: 10, ruestProPortionMin: 0.3 }
	},
	{
		id: 'creme-caramel',
		name: 'Crème Caramel',
		slot: 'dessert',
		ingredients: [
			g('Milch', {
				amountPerPerson: 120,
				unit: 'ml',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			}),
			g('Eier', {
				amountPerPerson: 0.5,
				unit: 'stk',
				dietClass: 'animalProduct',
				allergens: ['eier'],
				perishability: 'frisch_3_tage'
			}),
			g('Zucker (Caramel)', { amountPerPerson: 25 })
		],
		steps: [
			'Caramel in Förmchen giessen.',
			'Eier-Milch-Guss darüber, im Wasserbad stocken lassen.',
			'Kühl stürzen.'
		],
		cooking: { kochstellen: 1, brauchtOfen: true, ruestBasisMin: 25, ruestProPortionMin: 0.5 }
	},
	// ---------- Snack ----------
	{
		id: 'apero-plaettli',
		name: 'Apéro-Plättli',
		slot: 'snack',
		ingredients: [
			g('Salzgebäck', { amountPerPerson: 30, allergens: ['gluten'] }),
			g('Käsewürfel', {
				amountPerPerson: 30,
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			}),
			g('Trockenfrüchte', { amountPerPerson: 20 })
		],
		steps: ['Auf Platten anrichten.'],
		cooking: { kochstellen: 0, brauchtOfen: false, ruestBasisMin: 10, ruestProPortionMin: 0.2 }
	},
	{
		id: 'nachtsnack-brot',
		name: 'Mitternachtssnack: Brot & Schoggi',
		slot: 'snack',
		ingredients: [
			g('Brot / Zopf', { baseKey: 'zvieri', allergens: ['gluten'], perishability: 'frisch_1_tag' }),
			g('Schoggistängeli', {
				amountPerPerson: 25,
				dietClass: 'animalProduct',
				allergens: ['milch', 'soja']
			})
		],
		steps: ['Brot und Schokolade verteilen.', 'Warmen Tee dazu.'],
		cooking: { kochstellen: 1, brauchtOfen: false, ruestBasisMin: 8, ruestProPortionMin: 0.1 }
	},
	{
		id: 'nachos',
		name: 'Nachos mit Käse',
		slot: 'snack',
		ingredients: [
			g('Tortilla-Chips', { amountPerPerson: 50 }),
			g('Reibkäse', {
				baseKey: 'kaese',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			}),
			g('Salsa', { amountPerPerson: 40 })
		],
		steps: ['Chips mit Käse überbacken.', 'Mit Salsa servieren.'],
		cooking: { kochstellen: 0, brauchtOfen: true, ruestBasisMin: 10, ruestProPortionMin: 0.2 }
	}
];
