-- ============================================================================
-- Migration: Enable Row Level Security (RLS) Policies
-- Defense-in-depth security layer
-- ============================================================================
-- Note: API routes use admin client which bypasses RLS.
-- These policies are a backup protection layer for direct database access.
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reflections ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Stories Policies
-- ============================================================================

-- Users can read their own stories
CREATE POLICY "Users can read their own stories"
  ON stories
  FOR SELECT
  USING (auth.uid()::text = author_id::text);

-- Users can read public stories
CREATE POLICY "Users can read public stories"
  ON stories
  FOR SELECT
  USING (is_public = true);

-- Users can insert their own stories
CREATE POLICY "Users can insert their own stories"
  ON stories
  FOR INSERT
  WITH CHECK (auth.uid()::text = author_id::text);

-- Users can update their own stories
CREATE POLICY "Users can update their own stories"
  ON stories
  FOR UPDATE
  USING (auth.uid()::text = author_id::text)
  WITH CHECK (auth.uid()::text = author_id::text);

-- Users can delete their own stories
CREATE POLICY "Users can delete their own stories"
  ON stories
  FOR DELETE
  USING (auth.uid()::text = author_id::text);

-- ============================================================================
-- Story Metadata Policies
-- ============================================================================

-- Users can read metadata for their own stories
CREATE POLICY "Users can read their own story metadata"
  ON story_metadata
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_metadata.story_id
        AND stories.author_id::text = auth.uid()::text
    )
  );

-- Users can read metadata for public stories
CREATE POLICY "Users can read public story metadata"
  ON story_metadata
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_metadata.story_id
        AND stories.is_public = true
    )
  );

-- Users can update metadata for their own stories (e.g., marking as canonical)
CREATE POLICY "Users can update their own story metadata"
  ON story_metadata
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_metadata.story_id
        AND stories.author_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_metadata.story_id
        AND stories.author_id::text = auth.uid()::text
    )
  );

-- ============================================================================
-- Weekly Reflections Policies
-- ============================================================================

-- Users can only read their own reflections
CREATE POLICY "Users can read their own reflections"
  ON weekly_reflections
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Users can insert their own reflections
CREATE POLICY "Users can insert their own reflections"
  ON weekly_reflections
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Users can delete their own reflections
CREATE POLICY "Users can delete their own reflections"
  ON weekly_reflections
  FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON POLICY "Users can read their own stories" ON stories IS
  'Allow authenticated users to read their private stories';

COMMENT ON POLICY "Users can read public stories" ON stories IS
  'Allow anyone to read stories marked as public';

COMMENT ON POLICY "Users can read their own reflections" ON weekly_reflections IS
  'Reflections are private - only visible to the creator';
