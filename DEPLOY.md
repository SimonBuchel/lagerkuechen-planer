# Öffentlich bereitstellen (gratis, EU-Region)

Das Tool läuft ohne Login, Zahlung oder Datenbank. Für die Gratis-Bereitstellung
brauchst du nur ein Hosting. Empfohlen: **Vercel** (Gratis-Tarif), Region
**Frankfurt (fra1, EU)** – ist im Code bereits erzwungen (`vite.config.ts`).

> Env-Variablen sind **nicht** nötig. Login/Konto blenden sich automatisch aus,
> solange kein `AUTH_SECRET` gesetzt ist.

## Variante A — über GitHub (am einfachsten)

1. Kostenloses Konto erstellen bei **github.com** und **vercel.com** (mit GitHub anmelden).
2. Repo zu GitHub pushen (im Projektordner):
   ```bash
   git remote add origin https://github.com/<dein-name>/lagerkuechen-planer.git
   git push -u origin main
   ```
3. In Vercel: **Add New… → Project → Import** dein Repo. Framework „SvelteKit“
   wird automatisch erkannt. Auf **Deploy** klicken.
4. Nach ~1 Minute bekommst du eine URL wie `lagerkuechen-planer.vercel.app`.
   Fertig – jede weitere `git push` deployt automatisch neu.

## Variante B — über die Vercel-CLI (ohne GitHub)

```bash
npm i -g vercel
vercel        # einmalig einloggen und Projekt anlegen
vercel --prod # Produktions-Deployment
```

## Hinweise

- **Lokaler Build auf Windows:** `npm run build` bricht am Schluss mit einem
  Symlink-Fehler ab (Windows-Rechte). Das ist nur lokal – **Vercel baust
  problemlos** auf Linux. Zum lokalen Nutzen genügt `npm run dev`.
- **Datenschutz:** Das PDF-Parsing läuft serverseitig in der EU-Region (fra1).
  Es wird nichts gespeichert.
- **Später Konten/Zahlung aktivieren:** die nötigen Env-Variablen stehen in
  `src/lib/server/env.ts`; Datenbank-Setup in `db/README.md`.
- **Anderes Hosting:** Für einen eigenen Server statt Vercel `@sveltejs/adapter-node`
  verwenden; für Cloudflare Pages `@sveltejs/adapter-cloudflare` (dort ist die
  serverseitige PDF-Verarbeitung aber nicht garantiert).
