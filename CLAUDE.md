# Briefing für Claude Code: Lagerküchen-Planer

> Diese Datei ist verbindlich.
> Schweizer Rechtschreibung (immer «ss»). Code und Commits auf Englisch.
> Arbeite die Phasen in Kapitel 10 der Reihe nach ab. Kein Scope-Creep.

Der vollständige, verbindliche Auftrag liegt im ursprünglichen Briefing des
Nutzers vor. Kurzfassung der harten Regeln, die im Code niemals verletzt werden
dürfen:

## Nicht verhandelbar (Kapitel 8)

- **Keine Klarnamen im System.** Nur Pseudonyme (`TN-07`).
- **Keine Freitextfelder für Gesundheitsdaten.** Nur die kontrollierte
  Allergenliste (14 deklarationspflichtige + Nickel, Histamin, Fructose).
- E-Mail-Adressen aus eCamp-Titeln werden **entfernt und nicht persistiert**.
- Automatische Löschung 90 Tage nach Lagerende.
- Hosting in CH oder EU, Verschlüsselung at rest.
- Rezepte niemals wörtlich aus Kochbüchern/Websites übernehmen.

## Parser-Grundsätze (Kapitel 3)

- Niemals über den reinen Textlayer parsen — eCamp «Picasso» ist absolut
  positionierter Text ohne Leserichtung.
- Nichts hardcoden. Spaltengrenzen, Farbzuordnung (aus der Legende),
  Zeitachse (per Regression) und Ankerstunde zur Laufzeit ableiten.
- Ergebnis **immer** im Import-Assistenten zur Bestätigung anzeigen; jede Zeile
  korrigierbar.

## Stack (Kapitel 9)

SvelteKit + TypeScript strict · PostgreSQL (EU) · Magic-Link-Auth ·
`pdfjs-dist` serverseitig zum Lesen · Typst zum Schreiben · Vercel/Fly.io
(EU/CH) · Stripe inkl. TWINT + QR-Rechnung · Resend · Vitest + Playwright.

`lib/parser/`, `lib/quantities/`, `lib/rules/` sind reine Funktionen und müssen
bei jedem Commit grün getestet sein.

## Phasen (Kapitel 10)

1. **Parser** — eCamp-PDF → JSON, Fixture-Tests, Import-Assistent. ← _aktuell_
2. Mengen & Rezepte
3. Menüplan & Regeln
4. Einkauf & Dossier
5. Konto, Zahlung, Recht
6. Ausbau

Siehe das Original-Briefing für die vollständigen Details zu Rechenkern (5),
Regelwerk (6), Ausgaben (7) und Definition of Done (11).
