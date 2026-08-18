/**
 * Transactional e-mail via Resend's REST API (Phase 5). Env-guarded: when the
 * mail key is absent (e.g. local dev) it logs instead of sending, so nothing
 * breaks. No SDK dependency — a plain fetch keeps the surface small.
 */

import { config, isConfigured } from './env';

export interface MailResult {
	sent: boolean;
	/** Present when not sent (not configured, or an API error). */
	reason?: string;
}

/** Sends a magic-link e-mail, or logs it in dev when mail is not configured. */
export async function sendMagicLink(to: string, link: string): Promise<MailResult> {
	const subject = 'Dein Login-Link – Lagerküchen-Planer';
	const html = `<p>Hallo</p><p>Hier ist dein Login-Link (15 Min. gültig):</p>
<p><a href="${link}">Jetzt anmelden</a></p>
<p>Wenn du das nicht angefordert hast, ignoriere diese Mail.</p>`;

	if (!isConfigured.mail) {
		console.info(`[mail] (nicht konfiguriert) Magic-Link für ${to}: ${link}`);
		return { sent: false, reason: 'not-configured' };
	}

	try {
		const res = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${config.resendApiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ from: config.mailFrom, to, subject, html })
		});
		if (!res.ok) return { sent: false, reason: `resend ${res.status}` };
		return { sent: true };
	} catch (err) {
		return { sent: false, reason: String(err) };
	}
}
