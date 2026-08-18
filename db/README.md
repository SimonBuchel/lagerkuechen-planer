# Datenbank (Phase 5)

PostgreSQL, **in einer EU- oder CH-Region** betreiben (z. B. Supabase EU, Neon
EU), **Verschlüsselung at rest** aktivieren. Verbindung über `DATABASE_URL`.

## Einrichten

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

## Datenschutz (Kapitel 8)

- **Keine Klarnamen.** `persons.pseudonym` (z. B. `TN-07`); die Zuordnungsliste
  bleibt beim Lagerleiter auf Papier.
- **Keine Freitext-Gesundheitsdaten.** `allergies.allergen` nur aus der
  kontrollierten Liste (`src/lib/allergens`).
- **Einwilligung** wird in `consents` dokumentiert.

## 90-Tage-Löschautomatik

`camps.deletion_due = end_date + 90 Tage`. Ein täglicher Job (Vercel Cron /
Fly Machine / pg_cron) ruft `POST /api/cron/cleanup` auf. Der Endpoint nutzt
`lib/privacy/retention.ts` und löscht **nur Personendaten** fälliger Lager:

```sql
-- fällige Lager (Personendaten löschen, Camp/Menüs/Rezepte bleiben):
DELETE FROM persons WHERE camp_id IN (SELECT id FROM camps WHERE deletion_due <= current_date);
-- consents ebenso; allergies via ON DELETE CASCADE.
DELETE FROM consents WHERE camp_id IN (SELECT id FROM camps WHERE deletion_due <= current_date);
```

Sieben Tage vorher versendet der Job eine Vorwarnung per Mail
(`retentionStatus().shouldWarn`).

> Hinweis: Diese Anbindung ist Gerüst. Ein produktiver Betrieb braucht eine
> provisionierte EU/CH-Datenbank und die gesetzten Env-Variablen (siehe
> `src/lib/server/env.ts`).
