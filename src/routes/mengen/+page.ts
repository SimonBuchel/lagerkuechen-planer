import { redirect } from '@sveltejs/kit';

// The former standalone quantities view is now folded into the menu plan
// (per-meal amounts) and the shopping list. Redirect to keep old links working.
export const load = () => {
	redirect(307, '/menu');
};
