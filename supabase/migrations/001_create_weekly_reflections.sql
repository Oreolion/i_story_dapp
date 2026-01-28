-- ============================================================================
-- Migration: Create weekly_reflections table
-- Phase 3: Weekly AI Reflections
-- ============================================================================

-- Create the weekly_reflections table
CREATE TABLE IF NOT EXISTS weekly_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  user_wallet TEXT NOT NULL,
  reflection_text TEXT NOT NULL,
  stories_analyzed UUID[] DEFAULT '{}',
  themes_identified TEXT[] DEFAULT '{}',
  dominant_tone TEXT,
  dominant_domain TEXT,
  week_start TIMESTAMP WITH TIME ZONE NOT NULL,
  week_end TIMESTAMP WITH TIME ZONE NOT NULL,
  canonical_weight FLOAT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_reflections_user ON weekly_reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_reflections_created ON weekly_reflections(created_at DESC);

-- Unique constraint: one reflection per user per week
CREATE UNIQUE INDEX IF NOT EXISTS idx_reflections_user_week
  ON weekly_reflections(user_id, week_start);

-- Add comments for documentation
COMMENT ON TABLE weekly_reflections IS 'AI-generated weekly reflections analyzing user journal entries';
COMMENT ON COLUMN weekly_reflections.user_id IS 'Foreign key to users table';
COMMENT ON COLUMN weekly_reflections.reflection_text IS 'AI-generated reflection text (2-3 paragraphs)';
COMMENT ON COLUMN weekly_reflections.stories_analyzed IS 'Array of story UUIDs included in this reflection';
COMMENT ON COLUMN weekly_reflections.themes_identified IS 'Key themes extracted from the week''s stories';
COMMENT ON COLUMN weekly_reflections.dominant_tone IS 'Primary emotional tone detected (hopeful, anxious, etc.)';
COMMENT ON COLUMN weekly_reflections.dominant_domain IS 'Primary life domain (work, relationships, etc.)';
COMMENT ON COLUMN weekly_reflections.week_start IS 'Start of the week (Sunday 00:00:00)';
COMMENT ON COLUMN weekly_reflections.week_end IS 'End of the week (Saturday 23:59:59)';
COMMENT ON COLUMN weekly_reflections.canonical_weight IS 'Weight of canonical stories in this reflection';
