/**
 * In-session shared state (Phase 3). Holds the currently imported programme so
 * the import wizard and the menu planner can share it without a database —
 * persistence and consent come in Phase 5. Nothing here is written to disk.
 */

import type { ParsedProgram } from '$lib/parser/types';

export const session = $state<{ program: ParsedProgram | null }>({ program: null });

export function setProgram(program: ParsedProgram): void {
	session.program = program;
}
