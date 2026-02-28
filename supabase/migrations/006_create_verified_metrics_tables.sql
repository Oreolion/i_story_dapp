-- CRE verified metrics: full data stored off-chain, author-only access via API
CREATE TABLE IF NOT EXISTS verified_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  significance_score INTEGER DEFAULT 0,
  emotional_depth INTEGER DEFAULT 1,
  quality_score INTEGER DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  verified_themes TEXT[] DEFAULT '{}',
  metrics_hash TEXT,
  quality_tier INTEGER DEFAULT 1,
  meets_quality_threshold BOOLEAN DEFAULT FALSE,
  cre_attestation_id TEXT,
  on_chain_tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id)
);

CREATE INDEX IF NOT EXISTS idx_verified_metrics_story ON verified_metrics(story_id);

-- CRE verification request audit log
CREATE TABLE IF NOT EXISTS verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  triggered_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_logs_story ON verification_logs(story_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_status ON verification_logs(status);

-- RLS: Only service_role can read/write (admin client in API routes)
ALTER TABLE verified_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;

-- No public access policies — all access goes through admin client
-- (author-based filtering is enforced at the API layer in /api/cre/check)
