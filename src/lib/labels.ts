/**
 * Human-friendly German labels for the internal enum keys, so the UI never
 * shows raw values like "kuechenteam" or "meatAlternative".
 */

import type { ActivityLevel, IngredientDietClass, Perishability, Role } from './quantities/types';

export const ROLE_LABELS: Record<Role, string> = {
	teilnehmende: 'Teilnehmende',
	leitende: 'Leitende',
	kuechenteam: 'Küchenteam',
	besuch: 'Besuch'
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
	ruhetag: 'Ruhetag',
	normal: 'Normal',
	sport: 'Sport / Wanderung',
	bau: 'Bau / Abbau'
};

export const DIET_CLASS_LABELS: Record<IngredientDietClass, string> = {
	neutral: 'Für alle',
	meat: 'Fleisch',
	fish: 'Fisch',
	animalProduct: 'Tierisch (Milch/Ei/Käse)',
	meatAlternative: 'Vegi-Ersatz'
};

export const PERISHABILITY_LABELS: Record<Perishability, string> = {
	lagerfaehig: 'Lagerfähig',
	frisch_3_tage: 'Frisch (≈ 3 Tage)',
	frisch_1_tag: 'Frisch (1 Tag)'
};
