-- Migration: Create habits and daily_logs tables for the Daily Tracker feature
-- These tables may already exist in production (created manually).
-- Using IF NOT EXISTS for idempotency.

CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  target_frequency TEXT DEFAULT 'daily',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);

CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed_habit_ids UUID[] DEFAULT '{}',
  mood TEXT DEFAULT 'good',
  sleep_hours NUMERIC,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_logs_user_id ON daily_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(date DESC);

-- RLS
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

-- Policies (using IF NOT EXISTS pattern via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'habits' AND policyname = 'Users can manage own habits'
  ) THEN
    CREATE POLICY "Users can manage own habits" ON habits FOR ALL USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'daily_logs' AND policyname = 'Users can manage own daily_logs'
  ) THEN
    CREATE POLICY "Users can manage own daily_logs" ON daily_logs FOR ALL USING (true);
  END IF;
END
$$;
