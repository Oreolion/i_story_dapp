# Database Schema (Supabase PostgreSQL)

## Current Tables

| Table | Purpose |
|-------|---------|
| `users` | User profiles (wallet, name, avatar, badges) |
| `stories` | Journal entries (title, content, mood, paywall, audio) |
| `notifications` | In-app notifications |
| `comments` | Story comments |
| `saved_stories` | Bookmarks |
| `likes` | Like records |
| `waitlist` | Pre-launch email capture |
| `verified_metrics` | CRE-verified story metrics (full data, author-only access) |
| `verification_logs` | CRE verification request audit log |

**Storage Bucket:** `story-audio` - Audio file uploads

## Waitlist Table

```sql
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  source TEXT DEFAULT 'web_homepage',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(email)
);

CREATE INDEX idx_waitlist_email ON waitlist(email);
CREATE INDEX idx_waitlist_created ON waitlist(created_at DESC);
```

## CRE Verified Metrics Tables

```sql
-- Full metrics from CRE callback (author-only access via API)
CREATE TABLE verified_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  significance_score INTEGER DEFAULT 0,      -- 0-100
  emotional_depth INTEGER DEFAULT 1,          -- 1-5
  quality_score INTEGER DEFAULT 0,            -- 0-100
  word_count INTEGER DEFAULT 0,
  verified_themes TEXT[] DEFAULT '{}',
  metrics_hash TEXT,                          -- keccak256 of all metrics + salt
  quality_tier INTEGER DEFAULT 1,             -- 1-5 derived from quality_score
  meets_quality_threshold BOOLEAN DEFAULT FALSE,
  cre_attestation_id TEXT,
  on_chain_tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id)
);

CREATE INDEX idx_verified_metrics_story ON verified_metrics(story_id);

-- Audit log for CRE verification requests
CREATE TABLE verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'completed', 'failed'
  triggered_by UUID,                       -- user who triggered verification
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_verification_logs_story ON verification_logs(story_id);
CREATE INDEX idx_verification_logs_status ON verification_logs(status);
```

## Planned Tables (Phase 1-3)

```sql
-- Phase 1: Story metadata for cognitive features
CREATE TABLE story_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,

  -- AI-extracted fields
  themes TEXT[] DEFAULT '{}',
  emotional_tone TEXT,           -- 'reflective', 'joyful', 'anxious', 'hopeful', etc.
  life_domain TEXT,              -- 'work', 'relationships', 'health', 'identity', 'growth'

  -- Scoring (Self-Defining Memory detection)
  intensity_score FLOAT DEFAULT 0,     -- 0-1, emotional charge
  significance_score FLOAT DEFAULT 0,  -- 0-1, life event importance

  -- User controls
  is_canonical BOOLEAN DEFAULT FALSE,  -- User-marked as important
  ai_readable BOOLEAN DEFAULT TRUE,    -- Consent for AI analysis

  -- Extracted entities
  people_mentioned TEXT[] DEFAULT '{}',
  places_mentioned TEXT[] DEFAULT '{}',
  time_references TEXT[] DEFAULT '{}',

  -- Brief insight from analysis
  brief_insight TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(story_id)
);

-- Indexes for efficient queries
CREATE INDEX idx_story_metadata_themes ON story_metadata USING GIN(themes);
CREATE INDEX idx_story_metadata_domain ON story_metadata(life_domain);
CREATE INDEX idx_story_metadata_canonical ON story_metadata(is_canonical);
CREATE INDEX idx_story_metadata_story_id ON story_metadata(story_id);

-- Phase 3: Weekly AI reflections
CREATE TABLE weekly_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_wallet TEXT NOT NULL,
  reflection_text TEXT NOT NULL,
  stories_analyzed UUID[] DEFAULT '{}',
  themes_identified TEXT[] DEFAULT '{}',
  week_start TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reflections_wallet ON weekly_reflections(user_wallet);
CREATE INDEX idx_reflections_created ON weekly_reflections(created_at DESC);
```

## Database Implementation Guidelines

When fixing database constraint errors (409 Conflict, duplicate key), check ALL unique constraints on the table, not just the primary key - include wallet_address, email, and other unique fields. The `users` table has unique constraints on both `id` and `wallet_address`, so upsert operations must handle conflicts on each independently.

## Type Definitions

### Current Types (`app/types/index.ts`)

- `AuthorProfile` - User/author info
- `StoryDataType` - Story object with all properties
- `StoryCardProps` - Story display component props
- `FeaturedWriterType` - Featured writer for discovery
- `CommentDataTypes` - Comment structure
- `Notification` - Notification object

Constants: `mockStories[]`, `featuredWriters[]`, `moodColors{}`

### Planned Types (Phase 1)

```typescript
export interface StoryMetadata {
  id: string;
  story_id: string;
  themes: string[];
  emotional_tone: EmotionalTone;
  life_domain: LifeDomain;
  intensity_score: number;
  significance_score: number;
  is_canonical: boolean;
  ai_readable: boolean;
  people_mentioned: string[];
  places_mentioned: string[];
  time_references: string[];
  brief_insight: string | null;
  created_at: string;
  updated_at: string;
}

export type EmotionalTone =
  | 'reflective' | 'joyful' | 'anxious' | 'hopeful' | 'melancholic'
  | 'grateful' | 'frustrated' | 'peaceful' | 'excited' | 'uncertain';

export type LifeDomain =
  | 'work' | 'relationships' | 'health' | 'identity' | 'growth'
  | 'creativity' | 'spirituality' | 'family' | 'adventure' | 'learning';

export interface NarrativeObject extends StoryDataType {
  metadata?: StoryMetadata;
}

export interface WeeklyReflection {
  id: string;
  user_wallet: string;
  reflection_text: string;
  stories_analyzed: string[];
  themes_identified: string[];
  week_start: string;
  created_at: string;
}
```
