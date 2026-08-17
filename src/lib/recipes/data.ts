/**
 * First recipe collection (Phase 2, ≥ 20 recipes). Every ingredient carries its
 * allergen tags. Preparation steps are original short prose (Kapitel 8).
 *
 * Diet trick for meat dishes with a vegetarian variant: list both the meat
 * (`meat`) and the substitute (`meatAlternative`). The diet factor then scales
 * each to exactly the people who eat it.
 */

import type { Recipe } from './types';

export const RECIPES: readonly Recipe[] = [
	// ---- Hauptgerichte (Zmittag / Znacht) ----
	{
		id: 'spaghetti-bolognese',
		name: 'Spaghetti Bolognese',
		slot: 'zmittag',
		vegiVariante: true,
		ingredients: [
			{
				name: 'Spaghetti',
				baseKey: 'teigwaren',
				unit: 'g',
				dietClass: 'neutral',
				allergens: ['gluten'],
				perishability: 'lagerfaehig'
			},
			{
				name: 'Hackfleisch',
				baseKey: 'hack',
				unit: 'g',
				dietClass: 'meat',
				allergens: [],
				perishability: 'frisch_1_tag'
			},
			{
				name: 'Sojagranulat (vegi)',
				amountPerPerson: 25,
				unit: 'g',
				dietClass: 'meatAlternative',
				allergens: ['soja'],
				perishability: 'lagerfaehig'
			},
			{
				name: 'Pelati (Dosentomaten)',
				amountPerPerson: 120,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig'
			},
			{
				name: 'Zwiebel',
				amountPerPerson: 15,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig'
			},
			{
				name: 'Bouillon',
				amountPerPerson: 3,
				unit: 'g',
				dietClass: 'neutral',
				allergens: ['sellerie'],
				perishability: 'lagerfaehig',
				kesselClass: 'gewuerz'
			},
			{
				name: 'Bratöl',
				amountPerPerson: 5,
				unit: 'ml',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig',
				kesselClass: 'bratfett'
			},
			{
				name: 'Salz',
				amountPerPerson: 2,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig',
				kesselClass: 'salz'
			},
			{
				name: 'Reibkäse',
				baseKey: 'kaese',
				unit: 'g',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			}
		],
		steps: [
			'Zwiebel andämpfen, Fleisch bzw. Sojagranulat beigeben und anbraten.',
			'Pelati und Bouillon dazugeben, offen köcheln lassen, mit Salz abschmecken.',
			'Spaghetti in Salzwasser al dente kochen, abschütten.',
			'Sauce und Käse getrennt zur Pasta servieren (vegi-Portion separat halten).'
		],
		cooking: {
			kochstellen: 2,
			brauchtOfen: false,
			ruestBasisMin: 20,
			ruestProPortionMin: 0.4,
			volumenProPortionMl: 550
		}
	},
	{
		id: 'aelplermagronen',
		name: 'Älplermagronen',
		slot: 'zmittag',
		vegiVariante: true,
		ingredients: [
			{
				name: 'Hörnli',
				baseKey: 'teigwaren',
				unit: 'g',
				dietClass: 'neutral',
				allergens: ['gluten'],
				perishability: 'lagerfaehig'
			},
			{
				name: 'Kartoffeln',
				amountPerPerson: 150,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Reibkäse',
				baseKey: 'kaese',
				unit: 'g',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Rahm',
				amountPerPerson: 40,
				unit: 'ml',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Zwiebel',
				amountPerPerson: 20,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig'
			},
			{
				name: 'Butter',
				baseKey: 'butter',
				unit: 'g',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage',
				kesselClass: 'bratfett'
			},
			{
				name: 'Salz',
				amountPerPerson: 2,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig',
				kesselClass: 'salz'
			}
		],
		steps: [
			'Kartoffeln würfeln und weich kochen, Hörnli im selben Wasser fertig garen.',
			'Rahm mit Käse erwärmen, unter die abgeschütteten Hörnli und Kartoffeln mischen.',
			'Zwiebelringe in Butter goldbraun rösten und darüber verteilen.',
			'Dazu passt Apfelmus.'
		],
		cooking: {
			kochstellen: 2,
			brauchtOfen: false,
			ruestBasisMin: 25,
			ruestProPortionMin: 0.5,
			volumenProPortionMl: 500
		}
	},
	{
		id: 'gemuesecurry-reis',
		name: 'Gemüsecurry mit Reis',
		slot: 'zmittag',
		vegiVariante: true,
		ingredients: [
			{
				name: 'Reis',
				baseKey: 'reis',
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig'
			},
			{
				name: 'Saisongemüse',
				baseKey: 'gemuese',
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Kokosmilch',
				amountPerPerson: 70,
				unit: 'ml',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig'
			},
			{
				name: 'Currypaste',
				amountPerPerson: 8,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig',
				kesselClass: 'gewuerz'
			},
			{
				name: 'Zwiebel',
				amountPerPerson: 15,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig'
			},
			{
				name: 'Bratöl',
				amountPerPerson: 5,
				unit: 'ml',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig',
				kesselClass: 'bratfett'
			},
			{
				name: 'Salz',
				amountPerPerson: 2,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig',
				kesselClass: 'salz'
			}
		],
		steps: [
			'Reis nach Packung kochen.',
			'Zwiebel und Currypaste anrösten, Gemüse beigeben und kurz andämpfen.',
			'Mit Kokosmilch ablöschen, weich köcheln, abschmecken.',
			'Vegan, wenn keine Fischsauce in der Currypaste ist – Etikett prüfen.'
		],
		cooking: {
			kochstellen: 2,
			brauchtOfen: false,
			ruestBasisMin: 20,
			ruestProPortionMin: 0.6,
			volumenProPortionMl: 450
		}
	},
	{
		id: 'chili-con-carne',
		name: 'Chili con/sin Carne',
		slot: 'znacht',
		vegiVariante: true,
		ingredients: [
			{
				name: 'Hackfleisch',
				baseKey: 'hack',
				unit: 'g',
				dietClass: 'meat',
				allergens: [],
				perishability: 'frisch_1_tag'
			},
			{
				name: 'Sojagranulat (vegi)',
				amountPerPerson: 25,
				unit: 'g',
				dietClass: 'meatAlternative',
				allergens: ['soja'],
				perishability: 'lagerfaehig'
			},
			{
				name: 'Kidneybohnen',
				amountPerPerson: 80,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig'
			},
			{
				name: 'Mais',
				amountPerPerson: 40,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig'
			},
			{
				name: 'Pelati (Dosentomaten)',
				amountPerPerson: 100,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig'
			},
			{
				name: 'Reis',
				baseKey: 'reis',
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig'
			},
			{
				name: 'Chili & Kreuzkümmel',
				amountPerPerson: 1,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig',
				kesselClass: 'gewuerz'
			},
			{
				name: 'Salz',
				amountPerPerson: 2,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig',
				kesselClass: 'salz'
			}
		],
		steps: [
			'Fleisch bzw. Soja anbraten, Gewürze mitrösten.',
			'Pelati, Bohnen und Mais beigeben, mind. 20 Min. köcheln.',
			'Scharf vorsichtig dosieren und separat nachschärfen.',
			'Mit Reis servieren.'
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
		id: 'kartoffelstock-bratwurst',
		name: 'Kartoffelstock mit Bratwurst',
		slot: 'zmittag',
		vegiVariante: true,
		ingredients: [
			{
				name: 'Kartoffeln',
				baseKey: 'kartoffeln',
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Milch',
				amountPerPerson: 60,
				unit: 'ml',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Butter',
				baseKey: 'butter',
				unit: 'g',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Bratwurst',
				baseKey: 'fleisch',
				unit: 'g',
				dietClass: 'meat',
				allergens: [],
				perishability: 'frisch_1_tag'
			},
			{
				name: 'Gemüsebratwurst (vegi)',
				baseKey: 'fleischersatz',
				unit: 'g',
				dietClass: 'meatAlternative',
				allergens: ['gluten'],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Salz',
				amountPerPerson: 2,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig',
				kesselClass: 'salz'
			}
		],
		steps: [
			'Kartoffeln schälen, weich kochen und abschütten.',
			'Mit warmer Milch und Butter stampfen, salzen.',
			'Bratwürste separat (Fleisch/vegi getrennt) braten.',
			'Mit Zwiebelsauce oder Senf servieren.'
		],
		cooking: {
			kochstellen: 2,
			brauchtOfen: false,
			ruestBasisMin: 25,
			ruestProPortionMin: 0.5,
			volumenProPortionMl: 400
		}
	},
	{
		id: 'hoernli-hacksauce',
		name: 'Hörnli mit Hackfleischsauce',
		slot: 'znacht',
		vegiVariante: true,
		ingredients: [
			{
				name: 'Hörnli',
				baseKey: 'teigwaren',
				unit: 'g',
				dietClass: 'neutral',
				allergens: ['gluten'],
				perishability: 'lagerfaehig'
			},
			{
				name: 'Hackfleisch',
				baseKey: 'hack',
				unit: 'g',
				dietClass: 'meat',
				allergens: [],
				perishability: 'frisch_1_tag'
			},
			{
				name: 'Sojagranulat (vegi)',
				amountPerPerson: 25,
				unit: 'g',
				dietClass: 'meatAlternative',
				allergens: ['soja'],
				perishability: 'lagerfaehig'
			},
			{
				name: 'Pelati (Dosentomaten)',
				amountPerPerson: 110,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig'
			},
			{
				name: 'Reibkäse',
				baseKey: 'kaese',
				unit: 'g',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Salz',
				amountPerPerson: 2,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig',
				kesselClass: 'salz'
			}
		],
		steps: [
			'Hackfleisch bzw. Soja anbraten, Pelati beigeben, würzen.',
			'Hörnli kochen und abschütten.',
			'Sauce und Käse zur Pasta reichen.'
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
		id: 'kartoffelgratin',
		name: 'Kartoffelgratin',
		slot: 'zmittag',
		vegiVariante: true,
		ingredients: [
			{
				name: 'Kartoffeln',
				baseKey: 'kartoffeln',
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Rahm',
				amountPerPerson: 60,
				unit: 'ml',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Reibkäse',
				baseKey: 'kaese',
				unit: 'g',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Knoblauch',
				amountPerPerson: 2,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig'
			},
			{
				name: 'Salz & Muskat',
				amountPerPerson: 2,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig',
				kesselClass: 'gewuerz'
			}
		],
		steps: [
			'Kartoffeln in dünne Scheiben schneiden, in die gefettete Form schichten.',
			'Mit Knoblauchrahm übergiessen, salzen, Muskat.',
			'Käse darüber, bei 200 °C ca. 45 Min. backen, bis goldbraun.'
		],
		cooking: { kochstellen: 1, brauchtOfen: true, ruestBasisMin: 30, ruestProPortionMin: 0.6 }
	},
	{
		id: 'gemuese-lasagne',
		name: 'Gemüse-Lasagne',
		slot: 'zmittag',
		vegiVariante: true,
		ingredients: [
			{
				name: 'Lasagneblätter',
				baseKey: 'teigwaren',
				unit: 'g',
				dietClass: 'neutral',
				allergens: ['gluten'],
				perishability: 'lagerfaehig'
			},
			{
				name: 'Saisongemüse',
				baseKey: 'gemuese',
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Pelati (Dosentomaten)',
				amountPerPerson: 120,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig'
			},
			{
				name: 'Béchamel (Milch, Mehl, Butter)',
				amountPerPerson: 80,
				unit: 'ml',
				dietClass: 'animalProduct',
				allergens: ['milch', 'gluten'],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Reibkäse',
				baseKey: 'kaese',
				unit: 'g',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Salz & Kräuter',
				amountPerPerson: 2,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig',
				kesselClass: 'gewuerz'
			}
		],
		steps: [
			'Gemüse in Tomatensauce weich dünsten.',
			'Abwechselnd Sauce, Lasagneblätter und Béchamel schichten.',
			'Mit Käse abschliessen, bei 190 °C ca. 40 Min. backen.'
		],
		cooking: { kochstellen: 1, brauchtOfen: true, ruestBasisMin: 40, ruestProPortionMin: 0.8 }
	},
	{
		id: 'risotto-gemuese',
		name: 'Gemüserisotto',
		slot: 'zmittag',
		vegiVariante: true,
		ingredients: [
			{
				name: 'Risottoreis',
				baseKey: 'reis',
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig'
			},
			{
				name: 'Saisongemüse',
				baseKey: 'gemuese',
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Bouillon',
				amountPerPerson: 4,
				unit: 'g',
				dietClass: 'neutral',
				allergens: ['sellerie'],
				perishability: 'lagerfaehig',
				kesselClass: 'gewuerz'
			},
			{
				name: 'Reibkäse',
				baseKey: 'kaese',
				unit: 'g',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Zwiebel',
				amountPerPerson: 15,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig'
			},
			{
				name: 'Bratöl',
				amountPerPerson: 5,
				unit: 'ml',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig',
				kesselClass: 'bratfett'
			}
		],
		steps: [
			'Zwiebel andämpfen, Reis glasig rösten.',
			'Nach und nach heisse Bouillon zugeben und rührend garen.',
			'Gemüse mitgaren, am Schluss Käse unterrühren (vegan: weglassen).'
		],
		cooking: {
			kochstellen: 2,
			brauchtOfen: false,
			ruestBasisMin: 20,
			ruestProPortionMin: 0.7,
			volumenProPortionMl: 450
		}
	},
	{
		id: 'gemuesewaehe',
		name: 'Gemüsewähe',
		slot: 'znacht',
		vegiVariante: true,
		ingredients: [
			{
				name: 'Kuchenteig',
				amountPerPerson: 90,
				unit: 'g',
				dietClass: 'neutral',
				allergens: ['gluten'],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Saisongemüse',
				baseKey: 'gemuese',
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Guss (Eier, Milch, Rahm)',
				amountPerPerson: 70,
				unit: 'ml',
				dietClass: 'animalProduct',
				allergens: ['eier', 'milch'],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Reibkäse',
				baseKey: 'kaese',
				unit: 'g',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Salz',
				amountPerPerson: 2,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig',
				kesselClass: 'salz'
			}
		],
		steps: [
			'Teig ausrollen, Blech auslegen und einstechen.',
			'Gemüse verteilen, mit Guss übergiessen, Käse darüber.',
			'Bei 210 °C ca. 35 Min. backen.'
		],
		cooking: { kochstellen: 0, brauchtOfen: true, ruestBasisMin: 30, ruestProPortionMin: 0.5 }
	},
	// ---- Suppen / leichte & Wandertag ----
	{
		id: 'kuerbissuppe',
		name: 'Kürbissuppe',
		slot: 'zmittag',
		vegiVariante: true,
		ingredients: [
			{
				name: 'Kürbis',
				amountPerPerson: 220,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Kartoffeln',
				amountPerPerson: 60,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Bouillon',
				amountPerPerson: 4,
				unit: 'g',
				dietClass: 'neutral',
				allergens: ['sellerie'],
				perishability: 'lagerfaehig',
				kesselClass: 'gewuerz'
			},
			{
				name: 'Rahm',
				amountPerPerson: 20,
				unit: 'ml',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Brot',
				baseKey: 'brot-znacht',
				unit: 'g',
				dietClass: 'neutral',
				allergens: ['gluten'],
				perishability: 'frisch_1_tag'
			}
		],
		steps: [
			'Kürbis und Kartoffeln würfeln, in Bouillon weich kochen.',
			'Fein pürieren, mit Rahm verfeinern (vegan: Kokosmilch).',
			'Mit Brot servieren.'
		],
		cooking: {
			kochstellen: 1,
			brauchtOfen: false,
			ruestBasisMin: 20,
			ruestProPortionMin: 0.5,
			volumenProPortionMl: 350
		}
	},
	{
		id: 'pastasalat',
		name: 'Pastasalat (kalt, Wandertag)',
		slot: 'zmittag',
		vegiVariante: true,
		ingredients: [
			{
				name: 'Teigwaren',
				baseKey: 'teigwaren',
				unit: 'g',
				dietClass: 'neutral',
				allergens: ['gluten'],
				perishability: 'lagerfaehig'
			},
			{
				name: 'Gemüse & Mais',
				amountPerPerson: 120,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Hartkäsewürfel',
				baseKey: 'kaese',
				unit: 'g',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Salatsauce (Öl, Essig, Senf)',
				amountPerPerson: 20,
				unit: 'ml',
				dietClass: 'neutral',
				allergens: ['senf', 'sulfite'],
				perishability: 'lagerfaehig'
			}
		],
		steps: [
			'Teigwaren kochen, kalt abspülen und gut abtropfen.',
			'Mit Gemüse und Käse mischen, Sauce unterheben.',
			'Kühl transportieren; ideal fürs Lunchpaket.'
		],
		cooking: {
			kochstellen: 1,
			brauchtOfen: false,
			ruestBasisMin: 20,
			ruestProPortionMin: 0.4,
			volumenProPortionMl: 300
		}
	},
	// ---- Zmorge ----
	{
		id: 'zmorge-buffet',
		name: 'Zmorge-Buffet',
		slot: 'zmorge',
		ingredients: [
			{
				name: 'Brot',
				baseKey: 'brot-zmorge',
				unit: 'g',
				dietClass: 'neutral',
				allergens: ['gluten'],
				perishability: 'frisch_1_tag'
			},
			{
				name: 'Butter',
				baseKey: 'butter',
				unit: 'g',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Konfitüre',
				baseKey: 'konfi',
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig'
			},
			{
				name: 'Käse',
				baseKey: 'kaese',
				unit: 'g',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Müesli',
				baseKey: 'mueesli',
				unit: 'g',
				dietClass: 'neutral',
				allergens: ['gluten', 'schalenfruechte'],
				perishability: 'lagerfaehig'
			},
			{
				name: 'Milch',
				baseKey: 'milch',
				unit: 'ml',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			}
		],
		steps: [
			'Brot schneiden, Butter/Konfi/Käse bereitstellen.',
			'Müesli und Milch (auch laktosefrei/pflanzlich) anbieten.',
			'Tee und Kaffee aufsetzen.'
		],
		cooking: { kochstellen: 1, brauchtOfen: false, ruestBasisMin: 20, ruestProPortionMin: 0.3 }
	},
	{
		id: 'birchermuesli',
		name: 'Birchermüesli',
		slot: 'zmorge',
		ingredients: [
			{
				name: 'Haferflocken',
				baseKey: 'mueesli',
				unit: 'g',
				dietClass: 'neutral',
				allergens: ['gluten'],
				perishability: 'lagerfaehig'
			},
			{
				name: 'Joghurt',
				amountPerPerson: 120,
				unit: 'g',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Apfel',
				amountPerPerson: 80,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Nüsse',
				amountPerPerson: 10,
				unit: 'g',
				dietClass: 'neutral',
				allergens: ['schalenfruechte'],
				perishability: 'lagerfaehig'
			}
		],
		steps: [
			'Haferflocken über Nacht in Milch oder Joghurt einweichen.',
			'Apfel reiben und unterheben.',
			'Nüsse separat anbieten (Allergie).'
		],
		cooking: { kochstellen: 0, brauchtOfen: false, ruestBasisMin: 15, ruestProPortionMin: 0.3 }
	},
	// ---- Znacht (kalt) ----
	{
		id: 'znacht-brot-kaese',
		name: 'Znacht: Brot, Käse & Aufschnitt',
		slot: 'znacht',
		ingredients: [
			{
				name: 'Brot',
				baseKey: 'brot-znacht',
				unit: 'g',
				dietClass: 'neutral',
				allergens: ['gluten'],
				perishability: 'frisch_1_tag'
			},
			{
				name: 'Käse',
				baseKey: 'kaese',
				unit: 'g',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Aufschnitt',
				baseKey: 'aufschnitt',
				unit: 'g',
				dietClass: 'meat',
				allergens: [],
				perishability: 'frisch_1_tag'
			},
			{
				name: 'Butter',
				baseKey: 'butter',
				unit: 'g',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Gemüsesticks',
				amountPerPerson: 60,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'frisch_3_tage'
			}
		],
		steps: [
			'Brot, Käse, Aufschnitt und Gemüsesticks anrichten.',
			'Vegetarische Alternative (z. B. Hummus) bereitstellen.'
		],
		cooking: { kochstellen: 0, brauchtOfen: false, ruestBasisMin: 15, ruestProPortionMin: 0.3 }
	},
	{
		id: 'brotsuppe-znacht',
		name: 'Suppe mit Brot',
		slot: 'znacht',
		vegiVariante: true,
		ingredients: [
			{
				name: 'Suppe (Gemüse)',
				baseKey: 'suppe',
				unit: 'ml',
				dietClass: 'neutral',
				allergens: ['sellerie'],
				perishability: 'lagerfaehig',
				kesselClass: 'gewuerz'
			},
			{
				name: 'Brot',
				baseKey: 'brot-znacht',
				unit: 'g',
				dietClass: 'neutral',
				allergens: ['gluten'],
				perishability: 'frisch_1_tag'
			},
			{
				name: 'Reibkäse',
				baseKey: 'kaese',
				unit: 'g',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			}
		],
		steps: ['Suppe nach Rezept oder Fertigbasis aufkochen.', 'Mit Brot und etwas Käse servieren.'],
		cooking: {
			kochstellen: 1,
			brauchtOfen: false,
			ruestBasisMin: 15,
			ruestProPortionMin: 0.3,
			volumenProPortionMl: 350
		}
	},
	// ---- Dessert ----
	{
		id: 'schokopudding',
		name: 'Schokoladenpudding',
		slot: 'dessert',
		ingredients: [
			{
				name: 'Milch',
				amountPerPerson: 150,
				unit: 'ml',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Puddingpulver Schoko',
				amountPerPerson: 20,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig'
			},
			{
				name: 'Zucker',
				amountPerPerson: 15,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig'
			}
		],
		steps: [
			'Puddingpulver mit etwas kalter Milch anrühren.',
			'Restliche Milch mit Zucker aufkochen, Angerührtes einrühren, kurz köcheln.',
			'In Schüsseln abfüllen und kühl stellen (vegan mit Pflanzendrink möglich).'
		],
		cooking: {
			kochstellen: 1,
			brauchtOfen: false,
			ruestBasisMin: 10,
			ruestProPortionMin: 0.2,
			volumenProPortionMl: 170
		}
	},
	{
		id: 'fruchtsalat',
		name: 'Fruchtsalat',
		slot: 'dessert',
		ingredients: [
			{
				name: 'Saisonfrüchte',
				amountPerPerson: 200,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Zitronensaft',
				amountPerPerson: 5,
				unit: 'ml',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Zucker',
				amountPerPerson: 10,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig'
			}
		],
		steps: [
			'Früchte rüsten und klein schneiden.',
			'Mit Zitronensaft und wenig Zucker mischen.',
			'Kühl stellen; vegan und allergenarm.'
		],
		cooking: { kochstellen: 0, brauchtOfen: false, ruestBasisMin: 20, ruestProPortionMin: 0.6 }
	},
	{
		id: 'marmorkuchen',
		name: 'Marmorkuchen (Besuchstag)',
		slot: 'dessert',
		ingredients: [
			{
				name: 'Mehl',
				amountPerPerson: 45,
				unit: 'g',
				dietClass: 'neutral',
				allergens: ['gluten'],
				perishability: 'lagerfaehig'
			},
			{
				name: 'Butter',
				amountPerPerson: 25,
				unit: 'g',
				dietClass: 'animalProduct',
				allergens: ['milch'],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Eier',
				amountPerPerson: 0.5,
				unit: 'stk',
				dietClass: 'animalProduct',
				allergens: ['eier'],
				perishability: 'frisch_3_tage'
			},
			{
				name: 'Zucker',
				amountPerPerson: 30,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig'
			},
			{
				name: 'Kakao',
				amountPerPerson: 6,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig'
			}
		],
		steps: [
			'Butter mit Zucker schaumig rühren, Eier einzeln beigeben.',
			'Mehl unterheben, eine Hälfte mit Kakao färben.',
			'Beide Teige in die Form geben, marmorieren, bei 180 °C ca. 45 Min. backen.'
		],
		cooking: { kochstellen: 0, brauchtOfen: true, ruestBasisMin: 30, ruestProPortionMin: 0.4 }
	},
	// ---- Zvieri / Snack ----
	{
		id: 'zvieri-brot',
		name: 'Zvieri: Brot & Früchte',
		slot: 'zvieri',
		ingredients: [
			{
				name: 'Zvieri-Brot / Zopf',
				baseKey: 'zvieri',
				unit: 'g',
				dietClass: 'neutral',
				allergens: ['gluten'],
				perishability: 'frisch_1_tag'
			},
			{
				name: 'Frucht',
				baseKey: 'frucht',
				unit: 'stk',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'frisch_3_tage'
			}
		],
		steps: ['Brot/Zopf und Früchte bereitstellen.', 'Sirup anrühren.'],
		cooking: { kochstellen: 0, brauchtOfen: false, ruestBasisMin: 10, ruestProPortionMin: 0.2 }
	},
	{
		id: 'mitternachtssnack-popcorn',
		name: 'Mitternachtssnack: Popcorn',
		slot: 'snack',
		ingredients: [
			{
				name: 'Maiskörner',
				amountPerPerson: 25,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig'
			},
			{
				name: 'Öl',
				amountPerPerson: 5,
				unit: 'ml',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig',
				kesselClass: 'bratfett'
			},
			{
				name: 'Salz',
				amountPerPerson: 1,
				unit: 'g',
				dietClass: 'neutral',
				allergens: [],
				perishability: 'lagerfaehig',
				kesselClass: 'salz'
			}
		],
		steps: [
			'Öl im grossen Topf erhitzen, Mais beigeben, Deckel drauf.',
			'Unter Schütteln poppen lassen, salzen.',
			'Vegan und allergenarm.'
		],
		cooking: { kochstellen: 1, brauchtOfen: false, ruestBasisMin: 10, ruestProPortionMin: 0.1 }
	}
];
