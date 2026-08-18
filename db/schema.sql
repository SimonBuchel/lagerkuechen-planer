-- Lagerküchen-Planer — Datenbankschema (Phase 5)
-- PostgreSQL. In einer EU/CH-Region betreiben, Verschlüsselung at rest aktivieren
-- (z. B. Supabase EU / Neon EU). Kapitel 8: keine Klarnamen, nur Pseudonyme.
--
-- Personendaten (persons, allergies, consents) werden 90 Tage nach Lagerende
-- automatisch gelöscht (siehe db/README.md und lib/privacy/retention.ts).
-- Rezepte/Vorlagen sind keine Personendaten und bleiben.

CREATE TABLE IF NOT EXISTS accounts (
	id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	email         text NOT NULL UNIQUE,
	-- Zahlungsstatus aus Stripe (kein Kartendetail wird je gespeichert).
	subscription  text NOT NULL DEFAULT 'none',   -- none | active | past_due | canceled
	stripe_customer text,
	created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS camps (
	id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	account_id    uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
	name          text NOT NULL,
	place         text,
	start_date    date NOT NULL,
	end_date      date NOT NULL,
	-- Löschtermin für Personendaten = end_date + 90 Tage (Kapitel 8).
	deletion_due  date GENERATED ALWAYS AS (end_date + INTERVAL '90 days') STORED,
	created_at    timestamptz NOT NULL DEFAULT now()
);

-- Pseudonymisierte Personen — NIEMALS Klarnamen (Kapitel 8).
CREATE TABLE IF NOT EXISTS persons (
	id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	camp_id       uuid NOT NULL REFERENCES camps(id) ON DELETE CASCADE,
	pseudonym     text NOT NULL,                  -- z. B. "TN-07"
	role          text NOT NULL,                  -- teilnehmende | leitende | kuechenteam | besuch
	age_band      text NOT NULL                   -- 6-10 | 11-14 | 15-17 | 18+
);

-- Allergien nur aus der kontrollierten Liste; keine Freitext-Gesundheitsdaten.
CREATE TABLE IF NOT EXISTS allergies (
	id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	person_id     uuid NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
	allergen      text NOT NULL,                  -- Key aus lib/allergens
	severity      text NOT NULL                   -- unvertraeglichkeit | allergie | anaphylaxie
);

-- Dokumentierte Einwilligung beim Erfassen (Kapitel 8).
CREATE TABLE IF NOT EXISTS consents (
	id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	camp_id           uuid NOT NULL REFERENCES camps(id) ON DELETE CASCADE,
	version           text NOT NULL,
	granted_at        timestamptz NOT NULL DEFAULT now(),
	confirmed_by_role text NOT NULL               -- z. B. "Lagerleitung", nie ein Personenname
);

CREATE INDEX IF NOT EXISTS idx_camps_deletion_due ON camps(deletion_due);
CREATE INDEX IF NOT EXISTS idx_persons_camp ON persons(camp_id);
