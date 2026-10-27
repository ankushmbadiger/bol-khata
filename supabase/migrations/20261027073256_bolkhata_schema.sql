/*
# BolKhata core schema

## Overview
Creates the persistent ledger storage for BolKhata, a voice-first digital khata
for Indian kirana shops. Each shop's data is isolated to its authenticated owner
via Row Level Security keyed on auth.uid().

## Ledger convention (shopkeeper's perspective)
- direction is 'credit' or 'debit', stored per entry.
- CUSTOMER (receivable = money owed TO shopkeeper):
  - debit  = sale on credit -> customer owes MORE  (increases receivable)
  - credit = payment received -> customer owes LESS (decreases receivable)
  - customer outstanding = SUM(debits) - SUM(credits)
- SUPPLIER/distributor (payable = money shopkeeper owes):
  - credit = credit purchase -> we owe MORE  (increases payable)
  - debit  = payment made    -> we owe LESS (decreases payable)
  - supplier outstanding = SUM(credits) - SUM(debits)

## New Tables
1. profiles - shopkeeper profile, keyed on auth.users.id
2. parties - customers and suppliers/distributors
3. entries - the ledger rows (idempotency-protected)
4. entry_revisions - audit trail for corrections/reversals

## Security
- RLS on all tables; authenticated-only grants; owner-scoped policies.
- Idempotency unique constraint prevents duplicate submissions.
- CHECK constraints validate enums and amount > 0.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_name text NOT NULL DEFAULT 'My Shop',
  owner_name text,
  phone text,
  preferred_language text NOT NULL DEFAULT 'en-IN',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

CREATE TABLE IF NOT EXISTS parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  party_type text NOT NULL CHECK (party_type IN ('customer','supplier')),
  phone text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON parties TO authenticated;
DROP POLICY IF EXISTS "select_own_parties" ON parties;
CREATE POLICY "select_own_parties" ON parties FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_parties" ON parties;
CREATE POLICY "insert_own_parties" ON parties FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_parties" ON parties;
CREATE POLICY "update_own_parties" ON parties FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_parties" ON parties;
CREATE POLICY "delete_own_parties" ON parties FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS parties_user_idx ON parties(user_id);
CREATE INDEX IF NOT EXISTS parties_user_type_idx ON parties(user_id, party_type);

CREATE TABLE IF NOT EXISTS entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  party_id uuid NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
  party_type text NOT NULL CHECK (party_type IN ('customer','supplier')),
  direction text NOT NULL CHECK (direction IN ('credit','debit')),
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  payment_mode text NOT NULL DEFAULT 'na' CHECK (payment_mode IN ('cash','upi','bank','cheque','other','na')),
  note text,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('voice','manual')),
  transcript text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','reversed')),
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, idempotency_key)
);
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON entries TO authenticated;
DROP POLICY IF EXISTS "select_own_entries" ON entries;
CREATE POLICY "select_own_entries" ON entries FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_entries" ON entries;
CREATE POLICY "insert_own_entries" ON entries FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_entries" ON entries;
CREATE POLICY "update_own_entries" ON entries FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_entries" ON entries;
CREATE POLICY "delete_own_entries" ON entries FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS entries_user_idx ON entries(user_id);
CREATE INDEX IF NOT EXISTS entries_user_party_idx ON entries(user_id, party_id);
CREATE INDEX IF NOT EXISTS entries_user_date_idx ON entries(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS entries_user_status_idx ON entries(user_id, status);

CREATE TABLE IF NOT EXISTS entry_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('created','edited','reversed')),
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE entry_revisions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON entry_revisions TO authenticated;
DROP POLICY IF EXISTS "select_own_revisions" ON entry_revisions;
CREATE POLICY "select_own_revisions" ON entry_revisions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_revisions" ON entry_revisions;
CREATE POLICY "insert_own_revisions" ON entry_revisions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS revisions_entry_idx ON entry_revisions(entry_id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS parties_updated_at ON parties;
CREATE TRIGGER parties_updated_at BEFORE UPDATE ON parties
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
