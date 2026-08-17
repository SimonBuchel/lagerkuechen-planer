# eCamp-Fixtures

Hier liegen **echte, anonymisierte eCamp-«Picasso»-Exporte** als `.pdf`.

Sobald mindestens ein PDF hier liegt, prüft `real-fixtures.test.ts` beim
Testlauf automatisch, dass der Parser es vollständig einliest.

## Was hierher gehört

- Echte Picasso-Drucke aus `app.ecamp3.ch/print/`, unterschiedliche Längen und
  Formate (Hoch- und Querformat), damit die Definition of Done (Kapitel 11)
  erfüllt wird: mindestens vier verschiedene echte PDFs.

## Datenschutz

- **Vor dem Ablegen anonymisieren.** eCamp-Titel können E-Mail-Adressen und
  Namen enthalten. Der Parser entfernt E-Mails beim Einlesen, aber die
  Fixture-Datei selbst sollte keine echten Personendaten enthalten.
- Optional: eine erwartete JSON-Ausgabe als `<name>.expected.json` daneben
  legen; der Test vergleicht dann Tageszahl und Mahlzeiten gegen diese Werte.
