-- Migration: Add OAuth support fields to users table
-- Enables dual authentication (Web3 wallet + Google OAuth)

-- Make wallet_address nullable for OAuth-only users
ALTER TABLE public.users ALTER COLUMN wallet_address DROP NOT NULL;

-- Replace unique constraint with partial unique index
DROP INDEX IF EXISTS users_wallet_address_key;
CREATE UNIQUE INDEX users_wallet_address_unique
  ON public.users (wallet_address) WHERE wallet_address IS NOT NULL;

-- Add new columns
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'wallet'
    CHECK (auth_provider IN ('wallet', 'google', 'both')),
  ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS google_id TEXT;

-- Partial unique index for google_id
CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_unique
  ON public.users (google_id) WHERE google_id IS NOT NULL;

-- Backfill existing users as onboarded
UPDATE public.users SET is_onboarded = true WHERE wallet_address IS NOT NULL;
