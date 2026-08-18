/**
 * Optional AI menu planner (Phase 6). Turns the camp context into a compact
 * prompt, asks Claude for a slot-by-slot assignment with a constrained JSON
 * schema, and returns a validated assignment the client folds into its plan.
 *
 * Requires ANTHROPIC_API_KEY (server-side only). When it is unset the route
 * returns 503 and the UI keeps the free, deterministic planner. The key is read
 * from the environment and never exposed to the client.
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import Anthropic from '@anthropic-ai/sdk';
import { config as serverEnv, isConfigured } from '$lib/server/env';
import {
	aiPlanSchema,
	buildAiMessages,
	validateAssignment,
	type AiPlanInput
} from '$lib/menu/ai';

// Give the serverless function room for one thinking model call (Vercel Hobby: max 60s).
export const config = { maxDuration: 60 };

export const POST: RequestHandler = async ({ request }) => {
	if (!isConfigured.ai) {
		return json(
			{ error: 'KI-Planer ist nicht konfiguriert (ANTHROPIC_API_KEY fehlt).' },
			{ status: 503 }
		);
	}

	let input: AiPlanInput;
	try {
		input = (await request.json()) as AiPlanInput;
	} catch {
		return json({ error: 'Ungültige Anfrage.' }, { status: 400 });
	}
	if (!input?.days?.length || !input?.catalog?.length) {
		return json({ error: 'Kein Programm oder keine Rezepte vorhanden.' }, { status: 400 });
	}

	const client = new Anthropic({ apiKey: serverEnv.anthropicApiKey });
	const { system, user } = buildAiMessages(input);

	try {
		const response = await client.messages.create({
			model: 'claude-opus-5',
			max_tokens: 8000,
			thinking: { type: 'adaptive' },
			output_config: {
				effort: 'low',
				format: { type: 'json_schema', schema: aiPlanSchema(input) }
			},
			system,
			messages: [{ role: 'user', content: user }]
		});

		if (response.stop_reason === 'refusal') {
			return json(
				{ error: 'Die KI hat die Anfrage abgelehnt. Bitte den Regel-Planer nutzen.' },
				{ status: 502 }
			);
		}

		const text = response.content.find((b) => b.type === 'text');
		if (!text || text.type !== 'text') {
			return json({ error: 'Leere Antwort der KI.' }, { status: 502 });
		}

		const assignment = validateAssignment(input, JSON.parse(text.text));
		return json({ assignment });
	} catch (err) {
		console.error('ai-plan failed', err);
		return json(
			{ error: 'KI-Planung fehlgeschlagen. Bitte erneut versuchen oder den Regel-Planer nutzen.' },
			{ status: 502 }
		);
	}
};
