/**
 * Server-side configuration (Phase 5). Reads secrets from the environment at
 * runtime — nothing is hardcoded. Each integration exposes an `isConfigured`
 * flag so features degrade gracefully (and the app runs) when keys are absent.
 *
 * Required env vars (set them in the hosting platform, EU/CH region):
 *   AUTH_SECRET            - HMAC secret for magic-link tokens
 *   RESEND_API_KEY         - Resend mail API key
 *   MAIL_FROM              - verified sender address
 *   STRIPE_SECRET_KEY      - Stripe secret key (test or live)
 *   STRIPE_WEBHOOK_SECRET  - Stripe webhook signing secret
 *   STRIPE_PRICE_ID        - the subscription/one-off price id
 *   DATABASE_URL           - Postgres connection string (EU region)
 *   PUBLIC_BASE_URL        - external base URL for links
 */

import { env } from '$env/dynamic/private';

export const config = {
	authSecret: env.AUTH_SECRET ?? '',
	resendApiKey: env.RESEND_API_KEY ?? '',
	mailFrom: env.MAIL_FROM ?? '',
	stripeSecretKey: env.STRIPE_SECRET_KEY ?? '',
	stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET ?? '',
	stripePriceId: env.STRIPE_PRICE_ID ?? '',
	databaseUrl: env.DATABASE_URL ?? '',
	baseUrl: env.PUBLIC_BASE_URL ?? 'http://localhost:5173',
	anthropicApiKey: env.ANTHROPIC_API_KEY ?? ''
};

export const isConfigured = {
	auth: config.authSecret.length >= 16,
	mail: config.resendApiKey.length > 0 && config.mailFrom.length > 0,
	payments: config.stripeSecretKey.length > 0 && config.stripePriceId.length > 0,
	webhooks: config.stripeWebhookSecret.length > 0,
	database: config.databaseUrl.length > 0,
	ai: config.anthropicApiKey.length > 0
};
