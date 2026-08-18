/**
 * Lightweight i18n (Phase 6, Kapitel 10: Mehrsprachigkeit fr/it).
 *
 * A flat key→string dictionary per locale with German as the fallback. Pure and
 * testable; the reactive current-locale store lives in `locale.svelte.ts`.
 * Coverage starts with navigation and the landing page and grows over time —
 * unknown keys fall back to German, then to the key itself, so nothing breaks.
 */

export type Locale = 'de' | 'fr' | 'it';

export const LOCALES: { code: Locale; label: string }[] = [
	{ code: 'de', label: 'DE' },
	{ code: 'fr', label: 'FR' },
	{ code: 'it', label: 'IT' }
];

type Dict = Record<string, string>;

const de: Dict = {
	'nav.import': 'Import',
	'nav.menu': 'Menüplan',
	'nav.mengen': 'Mengen',
	'nav.einkauf': 'Einkauf',
	'nav.dossier': 'Dossier',
	'nav.rezepte': 'Rezepte',
	'nav.konto': 'Konto',
	'nav.lager': 'Lager',
	'landing.subtitle':
		'Aus deinem eCamp-Programm wird ein passender Menüplan: Wandertag heisst Lunchpaket, Besuchstag heisst Kuchen für die dreifache Menge, Anreisetag heisst – die Küche steht noch nicht.',
	'landing.cta': 'Programm importieren →',
	'landing.step1.title': '1. Importieren',
	'landing.step1.text':
		'eCamp-PDF hochladen oder Tage manuell erfassen. Alles bleibt korrigierbar.',
	'landing.step2.title': '2. Planen',
	'landing.step2.text': 'Menüplan, Mengen und Regeln – passend zum Programm.',
	'landing.step3.title': '3. Kochen',
	'landing.step3.text': 'Einkaufsliste und druckbares Küchendossier – offline im Lager nutzbar.',
	'footer.privacy': 'Datenschutz',
	'footer.imprint': 'Impressum',
	'footer.terms': 'Nutzungsbedingungen'
};

const fr: Dict = {
	'nav.import': 'Import',
	'nav.menu': 'Menus',
	'nav.mengen': 'Quantités',
	'nav.einkauf': 'Achats',
	'nav.dossier': 'Dossier',
	'nav.rezepte': 'Recettes',
	'nav.konto': 'Compte',
	'nav.lager': 'Camp',
	'landing.subtitle':
		'Ton programme eCamp devient un plan de menus adapté : jour de marche = pique-nique, jour de visite = gâteau en triple quantité, jour d’arrivée = la cuisine n’est pas encore prête.',
	'landing.cta': 'Importer le programme →',
	'landing.step1.title': '1. Importer',
	'landing.step1.text':
		'Téléverse le PDF eCamp ou saisis les jours manuellement. Tout reste modifiable.',
	'landing.step2.title': '2. Planifier',
	'landing.step2.text': 'Plan de menus, quantités et règles – adaptés au programme.',
	'landing.step3.title': '3. Cuisiner',
	'landing.step3.text':
		'Liste d’achats et dossier de cuisine imprimable – utilisable hors ligne au camp.',
	'footer.privacy': 'Protection des données',
	'footer.imprint': 'Mentions légales',
	'footer.terms': "Conditions d'utilisation"
};

const it: Dict = {
	'nav.import': 'Importa',
	'nav.menu': 'Menù',
	'nav.mengen': 'Quantità',
	'nav.einkauf': 'Spesa',
	'nav.dossier': 'Dossier',
	'nav.rezepte': 'Ricette',
	'nav.konto': 'Account',
	'nav.lager': 'Campo',
	'landing.subtitle':
		'Dal tuo programma eCamp nasce un piano dei menù su misura: giorno di escursione = pranzo al sacco, giorno di visita = torta in tripla quantità, giorno di arrivo = la cucina non è ancora pronta.',
	'landing.cta': 'Importa il programma →',
	'landing.step1.title': '1. Importa',
	'landing.step1.text':
		'Carica il PDF eCamp o inserisci i giorni manualmente. Tutto resta modificabile.',
	'landing.step2.title': '2. Pianifica',
	'landing.step2.text': 'Piano dei menù, quantità e regole – adatti al programma.',
	'landing.step3.title': '3. Cucina',
	'landing.step3.text':
		'Lista della spesa e dossier di cucina stampabile – utilizzabile offline al campo.',
	'footer.privacy': 'Protezione dei dati',
	'footer.imprint': 'Impressum',
	'footer.terms': "Condizioni d'uso"
};

const DICTS: Record<Locale, Dict> = { de, fr, it };

/** Translates a key for a locale, falling back to German, then to the key. */
export function t(key: string, locale: Locale): string {
	return DICTS[locale]?.[key] ?? DICTS.de[key] ?? key;
}

/** All translation keys (for coverage checks/tests). */
export function keysOf(locale: Locale): string[] {
	return Object.keys(DICTS[locale]);
}
