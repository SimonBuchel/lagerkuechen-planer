# eCamp-Importer: zwei Layouts, automatische Erkennung

Der Benutzer lädt **immer nur eine Datei** hoch und muss **nie** ein Layout
wählen. eCamp liefert jedoch zwei grundverschiedene Export-Formate desselben
Programms. Der Importer erkennt selbstständig, welches vorliegt, extrahiert die
Daten layout-unabhängig in dieselbe `ParsedProgram`-Struktur und fällt im
Zweifel auf das andere Layout zurück.

Analysiert wurden beide Varianten von fünf echten Lagern (AW-26, PfiLa-2026,
Kala-Tatzae-Pios, SoLa-25, Corps-SoLaHauptl).

## Die zwei Layouts

| Merkmal | **Layout 1 — «Picasso»** | **Layout 2 — «Grobprogramm»** |
|---|---|---|
| Erzeuger (`Producer`) | `Skia/PDF …` | `PDFKit` |
| Metadaten-Titel | `app.ecamp3.ch/print/?config={…"type":"Picasso"…}` (enthält Camp-/Perioden-IDs) | leer |
| Textmarker | `eCamp v3` oben | `Grobprogramm Hauptlager` oben links |
| Text | **zeichen-fragmentiert** (jeder Buchstabe ein eigenes Item, ~80 % ≤ 2 Zeichen) | **saubere ganze Strings** |
| Tageskopf | Wochentag + Datum **getrennt** (viele Fragmente) | `Fr 23.10.2026` als **ein** String |
| Zeitachse | nur links, Ankerstunde per PUA-Font dekodiert/geschätzt | `HH:MM`-Labels an **beiden** Rändern → direkt ablesbar |
| Kategorie | aus der **Füllfarbe** (Legende/Palette) | aus dem **Text-Präfix** `ES/LA/LP/LS` |
| Analyzer | `analyze.ts` | `grobprogramm.ts` |

Das Grobprogramm ist das **zuverlässigere** Format: Kategorie steht im Text,
die Zeitachse wird abgelesen statt geschätzt, keine Farb-/PUA-Heuristik nötig.

## Erkennung (`detect.ts`)

Score-basiert über **mehrere unabhängige Signale**, damit kein einzelnes
geändertes Detail die Zuordnung kippt (`> 0` → Picasso, `< 0` → Grobprogramm):

| Signal | Gewicht |
|---|---|
| Titel enthält `Picasso` / `ecamp3.ch/print` | +5 |
| Producer `Skia…` | +3 |
| Marker `eCamp v3` | +3 |
| Text stark fragmentiert (> 50 % kurze Items) | +2 |
| Producer `PDFKit` | −4 |
| Marker `Grobprogramm` | −4 |
| Saubere Tagesköpfe `Wd dd.mm.yyyy` | −2 |
| `HH:MM`-Labels an beiden Rändern | −2 |

In allen 10 Testdateien ist die Summe eindeutig (≥ 8 in die richtige Richtung).

## Extraktion Grobprogramm (`grobprogramm.ts`)

1. **Tagesspalten:** Wörter `^(Mo|Di|…|So)\s+dd.mm.yyyy$` → Datum (`parseHeaderDate`)
   + x-Position. Spaltengrenzen = Mittelpunkte zwischen benachbarten Kopf-x.
2. **Zeitachse:** Rand-Labels `^\d{1,2}:\d{2}$` (x in den äusseren 10 %).
   Mitternachts-Umbruch wird entfaltet (00:00 unter 23:00 → +24 h); die Steigung
   ist der **Median** der Nachbar-Steigungen → ein Ausreisser-Label (z. B. das
   Rahmen-00:00) verfälscht nichts. `anchorSource: 'decoded'`.
3. **Aktivitäten:** Wörter `^(ES|LA|LP|LS)\b …`. Kategorie = Präfix,
   Titel = Rest ohne führende Nummer (`2.1`). Tag = Spalte per x. Start =
   Achse(y). `end`/`responsible` bleiben null (bewusst – die 2-Buchstaben-Codes
   sind mehrdeutige Kürzel).
4. **Mehrseitig:** jede Seite hat eigene Köpfe + Achse; Tage werden per Datum
   zusammengeführt und dedupliziert.

## Sonderfälle & Rauschfilter

- **2-Buchstaben-Codes** (`SA`, `FI`, …) = Verantwortliche → ignoriert
  (ausser echte Kategorien `ES/LA/LP/LS`).
- **`Tagesverantwortliche: …`**, **`Grobprogramm …`**, **Legende/Footer**
  (untere ~18 % der Seite) → ignoriert.
- **Umgebrochene Titel:** eine Folgezeile ohne Kategorie, nahe darunter und
  bündig (≤ 22 pt x, ≤ 16 pt y) wird angehängt; endet die Vorzeile auf `-`,
  wird ohne Leerzeichen verbunden (`24h-Gelän-` + `despiel` → `24h-Geländespiel`).
- **Haus/Zelt:** aus dem Footer als Info-Hinweis in `warnings`.

## Fallback (`index.ts`)

1. Layout erkennen → passenden Analyzer laufen lassen.
2. Ist das Ergebnis **unplausibel** (`isPlausible`: < Hälfte der Tage hat
   Einträge), wird **das andere Layout** versucht und das mit mehr Blöcken
   (`programScore`) behalten – eine Fehlerkennung repariert sich so selbst.
3. `validateProgram` ergänzt Plausibilitäts-Warnungen (leere Tage, Datum nicht
   aufsteigend, Datumslücke, keine Mahlzeiten, unsichere Zeitachse).
4. Das erkannte Layout steht als `program.layout` und wird im Import-Assistenten
   als Badge angezeigt.

## Validierung mit echten Dateien

`real-fixtures.test.ts` lädt jede PDF in `__fixtures__/` und prüft Layout,
Tageszahl und Mahlzeiten gegen `<name>.expected.json`. Cross-Check beider
Layouts desselben Lagers (Beispiele): AW-26 beide 3 Tage / 5 Mahlzeiten; PfiLa
beide 4 Tage / 9 Mahlzeiten; Corps beide 15 Tage / 36 Mahlzeiten.
