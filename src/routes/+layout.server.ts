import type { LayoutServerLoad } from './$types';
import { isConfigured } from '$lib/server/env';

/**
 * Exposes which optional integrations are configured, so the UI can hide the
 * account/login entry point on a free deployment where auth isn't set up.
 */
export const load: LayoutServerLoad = () => ({
	authConfigured: isConfigured.auth
});
