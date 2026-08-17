# Parser: Annahmen und Bruchstellen (Phase 1)

Wie im Briefing (Kapitel 12) verlangt: was steckt an Annahmen im Parser, und wo
kann er brechen? Der Import-Assistent zeigt jedes Ergebnis zur Korrektur an –
genau deshalb, weil die folgenden Punkte nie zu 100 % sicher sind.

## Architektur-Seam

`pdf.ts` ist die einzige Datei mit pdf.js-Kontakt. Sie reduziert jede Seite auf
`PageGeometry` (gefüllte Rechtecke mit Farbe + positionierte Wörter, top-down).
Alle Ableitungen (`analyze`, `colors`, `geometry`, `text`, `dates`, `metadata`)
sind reine Funktionen darüber und ohne PDF unit-getestet.

## Feste Annahmen

1. **Kategorie = Füllfarbe.** Primär aus der Legende gelernt, sonst
   Referenzpalette. Fällt beides aus, wird das Text-Präfix `ES:/LA:/LP:/LS:`
   als Rückfall genutzt (mit Warnung).
2. **Tage = Spalten, Zeit = y-Achse.** Spaltengrenzen werden aus den
   x-Bändern der Aktivitätsrechtecke geclustert (Gap > 8 pt), nicht hartkodiert.
3. **Zeitachse linear.** Stundenhöhe = Median der vertikalen Abstände der
   Achsen-Labels. Anker: PUA-Ziffern per Monotonie + Injektivität dekodieren,
   sonst Klartext-Ziffern direkt, sonst Standard 07:00 – immer zur Bestätigung.
4. **Blockgrösse.** Als Aktivitätsblock zählt ein Rechteck mit Breite ≥ 20 pt
   und Höhe ≥ 5 pt, ausserhalb der Legenden-Fusszone und kein Seitenhintergrund.
5. **Legende steht im Seitenfuss** (unteres 20 %), Farbfeld links vom Label.
6. **Datum extrahiert sauber** aus den Spaltenköpfen (Normalfont).
7. **Metadaten** stehen als JSON im PDF-`Title` (Camp-/Period-IDs).

## Bekannte Bruchstellen

- **Wort-Umbruch-Heuristik (Kapitel 3.3) ist naiv.** Regel: Zeile endet auf
  Buchstabe + nächste beginnt klein → ohne Leerzeichen kleben. Ein echter
  Wortumbruch («Wande»/«rung») wird korrekt geklebt, aber ein
  Zeilenumbruch an der Wortgrenze mit klein beginnendem Folgewort
  («Ausflug»/«zum») wird fälschlich zu «Ausflugzum». → im Assistenten
  korrigierbar; Kandidat für spätere Verbesserung (Silben-/Lexikonprüfung).
- **Farbtoleranz** (0.15 im Einheitswürfel). Sehr helle oder stark
  transparente Themes können knapp daneben liegen → als «unbekannte Farbe»
  gewarnt statt still falsch zugeordnet.
- **Ankerstunde bei PUA-Ziffern** ist nur eindeutig, wenn die Labelfolge lang
  genug und streng stündlich ist. Bei sehr kurzen Achsen bleibt es Standard
  07:00 (mit Warnung).
- **Blockhöhe = Dauer.** Endzeit wird aus der Rechteck-Unterkante berechnet;
  bei überlappenden oder sehr kleinen Blöcken kann die Zeit ±10 min abweichen.
- **Spalten-Clustering** setzt klar getrennte Tagesbänder voraus. Bei
  Querformaten mit sehr engen Spalten oder ineinanderlaufenden Rechtecken kann
  die Spaltenzahl kippen. → Spaltengap ist der wichtigste Tuning-Parameter.
- **Type-3-Subset-Font-Extraktion:** die Zeitziffern kommen als
  PUA-Codepoints; wird das Mapping pro Dokument nicht gelernt, ist nur die
  Geometrie (nicht der Ziffern-Text) verlässlich – so ist der Parser gebaut.
- **Rotierte Seiten** werden aktuell mit `scale:1, rotation:0` gelesen. Stark
  rotierte Exporte (90°) sind noch nicht abgedeckt (nächster Härtungsschritt).

## An echten Exporten validiert

Gegen drei echte Hauptlager-Exporte getestet (Querformat, 4 bis 14 Tage,
zwei verschiedene Farb-Themes, mehrseitig). Ergebnisse und die daraus
gelernten Anpassungen:

- **Tagesspalten sind lückenlos** → Spalten werden aus der Raster-Zellbreite
  (Modus) und geclusterten linken Kanten abgeleitet, nicht aus Lücken.
- **Kategorie-Farben variieren stark je Theme** (ein Lager nutzt Pastelltöne,
  ein anderes die gesättigte Referenzpalette) → Legende wird zwingend gelernt,
  Fragmente je Farbfeld zusammengesetzt.
- **Datum** ist ein sauberes Einzeltoken im Spaltenkopf → zuverlässig.
- eCamp kennt teils eine **5. Kategorie «Höck» (rot)**, die nicht ES/LA/LP/LS
  ist → solche Blöcke bleiben ohne Kategorie und werden im Assistenten zugeteilt.

Gegen Text-Bleed bei überlappenden Blöcken:

- Jedes Wort wird **genau einem Block** zugewiesen (dem, der direkt darüber
  beginnt), damit sich zwei gleichzeitige Blöcke nicht denselben Text teilen.
- Taucht das eigene `XX:`-Präfix eines Blocks erst nach etwas Störtext auf
  («rregeln LS: Ultimate»), wird der Störtext davor verworfen.
- Verwaiste `[`/`]`-Klammern werden aus dem Titel entfernt.

Verbleibende Restfehler an echten Daten (alle im Assistenten korrigierbar):

- **«Höck» (rote 5. Kategorie)** wird mangels ES/LA/LP/LS auf die farblich
  nächste der vier Kategorien gelegt (statt leer) – Kandidat für eine
  explizite 5. Kategorie.
- **Über-Kleben** bei an Wortgrenzen umgebrochenen Titeln
  («Challenges»+«auf» → «Challengesauf»), Folge der naiven Umbruchregel.
- Gelegentliche **Titel-Abschneidung** am Blockrand, wenn Text über die
  Blockbreite hinausläuft.
- **Ankerstunde** wird bei einem Theme per PUA dekodiert, beim anderen fällt
  sie auf 07:00 zurück (mit Warnung) – die Zeiten stimmen trotzdem.

## Definition-of-Done-Stand

`real-fixtures.test.ts` prüft die drei echten PDFs gegen Golden-Tageszahlen
(14 / 14 / 4). Die PDFs enthalten echte Leitungsnamen im Fuss und sind daher
**git-ignoriert** (revDSG / Kapitel 8) – committet sind nur die
`*.expected.json`. Für die volle DoD (Kapitel 11: ≥ 4 PDFs) fehlt noch ein
vierter, andersartiger Export (z. B. Hochformat oder Kurzlager).
