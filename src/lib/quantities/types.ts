/**
 * Types for the quantity engine (Phase 2, Kapitel 5).
 *
 * Everything here is pure data. The scaling formulas live in `scale.ts`, the
 * kettle correction in `kessel.ts`, the kitchen timing in `timing.ts` — all as
 * pure functions with no DB or DOM access, so each can be unit-tested in full.
 */

/** Person role in the camp (Kapitel 4). */
export type Role = 'teilnehmende' | 'leitende' | 'kuechenteam' | 'besuch';

/** Age band (Kapitel 4). */
export type AgeBand = '6-10' | '11-14' | '15-17' | '18+';

/** One group of people of the same role and age band. */
export interface PersonGroup {
	role: Role;
	ageBand: AgeBand;
	count: number;
}

/**
 * Activity level of a single day, driving the activity factor. In Phase 3 this
 * is derived from the programme; in Phase 2 it is an explicit input.
 */
export type ActivityLevel = 'ruhetag' | 'normal' | 'sport' | 'bau';

/**
 * Head counts per special diet (Kapitel 4). These are subsets of the total
 * head count; a person can appear in several (e.g. vegan and glutenfrei).
 */
export interface DietComposition {
	vegetarisch: number;
	vegan: number;
	halal: number;
	koscher: number;
	laktosefrei: number;
	glutenfrei: number;
}

/** How an ingredient relates to the diet mix, driving the diet factor. */
export type IngredientDietClass =
	/** Everyone eats it (bread, vegetables, rice, pasta). */
	| 'neutral'
	/** Meat: not eaten by vegetarians or vegans. */
	| 'meat'
	/** Fish: not eaten by vegetarians or vegans. */
	| 'fish'
	/** Milk, cheese, egg, butter: not eaten by vegans. */
	| 'animalProduct'
	/** The meat-substitute portion, eaten by vegetarians and vegans. */
	| 'meatAlternative';

/** Shelf life class, driving the fresh-produce reserve and shopping schedule. */
export type Perishability = 'lagerfaehig' | 'frisch_3_tage' | 'frisch_1_tag';

/** Seasoning class for the kettle correction (Kapitel 5.2). */
export type KesselClass = 'gewuerz' | 'salz' | 'bratfett';

/** Feedback after a camp, used to calibrate base quantities (Kapitel 5.1). */
export type PortionFeedback = 'zu_viel' | 'richtig' | 'zu_wenig';

/** The context needed to scale one meal's ingredients to camp size. */
export interface ScalingContext {
	groups: PersonGroup[];
	activity: ActivityLevel;
	diet: DietComposition;
	/** First camp day gets a higher reserve for fresh produce (Kapitel 5.1). */
	isFirstDay?: boolean;
}

/** Kitchen equipment as entered by the user (Kapitel 4). */
export interface KitchenEquipment {
	/** Number of gas burners / cooking stations. */
	gasbrenner: number;
	/** Available kettle sizes in litres. */
	kesselLiter: number[];
	backofen: boolean;
	/** Fridge/cool storage capacity in litres. */
	kuehlkapazitaetLiter: number;
	naechsterLaden?: { name?: string; distanzKm: number };
}

/** What a recipe needs from the kitchen at camp scale (Kapitel 5.2). */
export interface CookingRequirement {
	/** Kettle volume needed in litres. */
	kesselLiter: number;
	/** Number of cooking stations occupied simultaneously. */
	kochstellen: number;
	/** Whether an oven is required. */
	brauchtOfen: boolean;
	/** Preparation effort in person-minutes. */
	ruestPersonenminuten: number;
}
