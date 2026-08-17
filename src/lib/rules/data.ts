/**
 * The programme→menu rule catalogue (Kapitel 6), expressed purely as data.
 * The engine in `engine.ts` interprets these; nothing here is hardcoded logic.
 */

import type { MenuRule } from './types';

export const MENU_RULES: readonly MenuRule[] = [
	{
		id: 'wanderung',
		label: 'Wanderung / Ausflug',
		confidence: 'sicher',
		trigger: { keywords: ['wanderung', 'hike', 'ausflug', 'off-'], minDurationH: 5 },
		effects: [
			{
				slot: 'zmittag',
				kind: 'lunchpaket',
				reason: 'Langer Block ausserhalb – Lunchpaket statt Küchenzmittag.'
			},
			{
				slot: 'zmorge',
				kind: 'shift-earlier',
				value: 40,
				reason: 'Früher Aufbruch – Zmorge 30–45 Min. früher.'
			},
			{ slot: 'znacht', kind: 'style', reason: 'Znacht deftig und aufwärmbar planen.' }
		]
	},
	{
		id: 'baden',
		label: 'Baden / Wasser',
		confidence: 'vorschlag',
		trigger: { keywords: ['baden', 'freibad', 'fluss', 'schlucht', 'see', 'schwimm'] },
		effects: [
			{ slot: 'zmittag', kind: 'style', reason: 'Zmittag leicht und transportabel halten.' },
			{ slot: 'zvieri', kind: 'style', reason: 'Zvieri mit Zucker (Energie nach dem Baden).' },
			{ kind: 'note', reason: 'Extrawasser einplanen.' }
		]
	},
	{
		id: 'besuchstag',
		label: 'Besuchstag',
		confidence: 'sicher',
		trigger: { keywords: ['besuch', 'elternbesuch', 'besuchstag'] },
		effects: [
			{
				slot: 'zvieri',
				kind: 'portion-factor',
				value: 2.5,
				reason: 'Gästefaktor ×2 bis ×3 für Zvieri.'
			},
			{ slot: 'dessert', kind: 'style', reason: 'Kuchen und Kaffee für die Gäste.' },
			{ slot: 'zmittag', kind: 'style', reason: 'Zmittag grosszügig mit Reserve.' }
		]
	},
	{
		id: 'lagerbau',
		label: 'Lagerbau / Pioniertechnik',
		confidence: 'vorschlag',
		trigger: { keywords: ['lagerbau', 'aufbau', 'abbau', 'pionier', 'sarasani', 'bauen'] },
		effects: [
			{ slot: 'zmittag', kind: 'style', reason: 'Deftig und kalorienreich, pünktlich.' },
			{ slot: 'zvieri', kind: 'add-snack', reason: 'Zvieri obligatorisch bei Bauarbeit.' }
		]
	},
	{
		id: 'nachtaktivitaet',
		label: 'Nachtaktivität',
		confidence: 'sicher',
		trigger: {
			keywords: [
				'nachtaktivität',
				'nachtgeländespiel',
				'krimi-dinner',
				'nachtwanderung',
				'nachtübung'
			]
		},
		effects: [
			{ slot: 'znacht', kind: 'shift-earlier', value: 45, reason: 'Znacht 30–60 Min. vorziehen.' },
			{ slot: 'mitternachtssnack', kind: 'add-snack', reason: 'Mitternachtssnack einplanen.' }
		]
	},
	{
		id: 'party',
		label: 'Casino / Disco / Fun-Abend',
		confidence: 'vorschlag',
		trigger: { keywords: ['casino', 'disco', 'party', 'fun-abend', 'fest-abend'] },
		effects: [
			{ slot: 'snack', kind: 'add-snack', reason: 'Fingerfood zusätzlich.' },
			{ kind: 'note', reason: 'Sirup zusätzlich bereitstellen.' }
		]
	},
	{
		id: 'feier',
		label: 'Eröffnung / Schlussfeier / Lagergericht',
		confidence: 'sicher',
		trigger: {
			keywords: ['eröffnung', 'schlussfeier', 'versprechen', 'lagergericht', 'abschluss']
		},
		effects: [
			{ slot: 'zmittag', kind: 'style', reason: 'Festmenü mit grosszügiger Kochzeit.' },
			{ slot: 'dessert', kind: 'add-snack', reason: 'Dessert zum Fest.' }
		]
	},
	{
		id: 'anreise',
		label: 'Anreise (erster Tag)',
		confidence: 'sicher',
		trigger: { dayPosition: 'first' },
		effects: [
			{
				slot: 'zmittag',
				kind: 'no-kitchen',
				reason: 'Küche steht noch nicht – Zmittag kalt oder als Einpfannen-Gericht.'
			}
		]
	},
	{
		id: 'abreise',
		label: 'Abreise (letzter Tag)',
		confidence: 'sicher',
		trigger: { dayPosition: 'last' },
		effects: [
			{ slot: 'zmittag', kind: 'leftovers', reason: 'Restenverwertung, kein Neueinkauf.' },
			{ slot: 'zvieri', kind: 'lunchpaket', reason: 'Lunchpaket für den Heimweg.' }
		]
	},
	{
		id: 'morgen-frueh',
		label: 'Frühe Morgenaktivität',
		confidence: 'sicher',
		trigger: { startsBefore: '08:00' },
		effects: [
			{
				slot: 'zmorge',
				kind: 'shift-earlier',
				value: 30,
				reason: 'Aktivität vor 08:00 – Zmorge vorverschieben, Aufstehzeit neu rechnen.'
			}
		]
	},
	{
		id: 'ganztagesausflug',
		label: 'Externer Ganztagesausflug',
		confidence: 'vorschlag',
		trigger: {
			keywords: ['ganztagesausflug', 'tagesausflug', 'ausflug ganzer tag', 'externer ausflug'],
			minDurationH: 7
		},
		effects: [
			{
				slot: 'zmittag',
				kind: 'no-kitchen',
				reason: 'Zmittag auswärts – Küche kalt lassen (bitte bestätigen).'
			}
		]
	}
];
