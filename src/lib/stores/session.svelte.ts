/**
 * In-session shared state (Phase 3+). Holds the imported programme, the menu
 * plan and the camp context (people, diet, equipment, allergies) so the import
 * wizard, the menu planner and the quantities view can share them without a
 * database — persistence and consent come in Phase 5. Nothing is written to disk.
 */

import type { ParsedProgram } from '$lib/parser/types';
import type { MenuPlan } from '$lib/menu/plan';
import type { AllergyProfile } from '$lib/allergens/types';
import type {
	ActivityLevel,
	DietComposition,
	KitchenEquipment,
	PersonGroup
} from '$lib/quantities/types';

/** Everything the quantity engine needs about the camp (Kapitel 4). */
export interface CampContext {
	groups: PersonGroup[];
	diet: DietComposition;
	/** Default daily activity level (per-day override can come from the rules). */
	activity: ActivityLevel;
	equipment: KitchenEquipment;
	allergies: AllergyProfile[];
	/** Budget target in CHF per person and day (Kapitel 4 / 7.4). */
	budgetPerPersonDay: number;
	/** Buy in catering pack sizes. */
	grossverbraucher: boolean;
}

function defaultContext(): CampContext {
	return {
		groups: [
			{ role: 'teilnehmende', ageBand: '11-14', count: 24 },
			{ role: 'leitende', ageBand: '18+', count: 5 },
			{ role: 'kuechenteam', ageBand: '18+', count: 2 }
		],
		diet: { vegetarisch: 3, vegan: 1, halal: 0, koscher: 0, laktosefrei: 1, glutenfrei: 1 },
		activity: 'normal',
		equipment: { gasbrenner: 4, kesselLiter: [30, 50], backofen: true, kuehlkapazitaetLiter: 200 },
		allergies: [],
		budgetPerPersonDay: 12,
		grossverbraucher: false
	};
}

export const session = $state<{
	program: ParsedProgram | null;
	plan: MenuPlan | null;
	context: CampContext;
}>({
	program: null,
	plan: null,
	context: defaultContext()
});

export function setProgram(program: ParsedProgram): void {
	session.program = program;
}
