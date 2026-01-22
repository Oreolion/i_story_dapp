# PLAN_PHASE1.5_AND_PHASE2.md — Post-Foundation Validation & Patterns Implementation

> **Current Phase:** Phase 1.5 — Validation & Hardening  
> **Next Phase:** Phase 2 — Patterns & Discovery  
> **Last Updated:** January 2026

---

## Phase 1.5: Validation & Hardening

### 🎯 Objective
Ensure Phase 1 implementation is production-ready before building additional features. Establish metrics baselines and fix any edge cases.

### Duration: 3-5 days

---

### Step 1: Automated Testing Suite

**Priority:** 🔴 Critical | **Time:** 4-6 hours

#### 1.1 Unit Tests for Analysis Endpoint

**File:** `__tests__/api/analyze.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST, GET } from "@/app/api/ai/analyze/route";
import { NextRequest } from "next/server";

// Mock Supabase
vi.mock("@/app/utils/supabase/supabaseServer", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      upsert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(() => ({ data: mockMetadata, error: null })) })) })),
      select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn(() => ({ data: mockMetadata, error: null })) })) })),
      update: vi.fn(() => ({ eq: vi.fn(() => ({ data: null, error: null })) })),
    })),
  })),
}));

// Mock Gemini
vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: vi.fn(() => ({
      generateContent: vi.fn(() => Promise.resolve({
        response: {
          text: () => JSON.stringify({
            themes: ["growth", "reflection"],
            emotional_tone: "hopeful",
            life_domain: "identity",
            intensity_score: 0.7,
            significance_score: 0.6,
            people_mentioned: ["Mom"],
            places_mentioned: ["New York"],
            time_references: ["last year"],
            brief_insight: "A journey of self-discovery.",
          }),
        },
      })),
    })),
  })),
}));

const mockMetadata = {
  id: "test-id",
  story_id: "story-123",
  themes: ["growth"],
  emotional_tone: "hopeful",
  life_domain: "identity",
  intensity_score: 0.7,
  significance_score: 0.6,
  is_canonical: false,
  analysis_status: "completed",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe("/api/ai/analyze", () => {
  describe("POST", () => {
    it("should return 400 for missing storyId", async () => {
      const request = new NextRequest("http://localhost:3000/api/ai/analyze", {
        method: "POST",
        body: JSON.stringify({ storyText: "Some text" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("storyId");
    });

    it("should return 400 for missing storyText", async () => {
      const request = new NextRequest("http://localhost:3000/api/ai/analyze", {
        method: "POST",
        body: JSON.stringify({ storyId: "123" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it("should return 400 for story text too short", async () => {
      const request = new NextRequest("http://localhost:3000/api/ai/analyze", {
        method: "POST",
        body: JSON.stringify({ storyId: "123", storyText: "Too short" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("too short");
    });

    it("should successfully analyze a valid story", async () => {
      const request = new NextRequest("http://localhost:3000/api/ai/analyze", {
        method: "POST",
        body: JSON.stringify({
          storyId: "story-123",
          storyText: "Today I realized something important about myself. After years of struggling with self-doubt, I finally understood that growth comes from embracing uncertainty.",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.metadata).toBeDefined();
      expect(data.metadata.themes).toContain("growth");
    });
  });

  describe("GET", () => {
    it("should return 400 for missing storyId parameter", async () => {
      const request = new NextRequest("http://localhost:3000/api/ai/analyze");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("storyId");
    });

    it("should return metadata for valid storyId", async () => {
      const request = new NextRequest("http://localhost:3000/api/ai/analyze?storyId=story-123");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.metadata).toBeDefined();
    });
  });
});
```

#### 1.2 Component Tests

**File:** `__tests__/components/StoryInsights.test.tsx`

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StoryInsights } from "@/components/StoryInsights";
import { StoryMetadata } from "@/app/types/metadata";

const mockMetadata: StoryMetadata = {
  id: "test-id",
  story_id: "story-123",
  themes: ["growth", "reflection", "change"],
  emotional_tone: "hopeful",
  life_domain: "identity",
  intensity_score: 0.7,
  significance_score: 0.85,
  is_canonical: false,
  ai_readable: true,
  people_mentioned: ["Mom", "Dad"],
  places_mentioned: ["New York", "Chicago"],
  time_references: ["last summer"],
  brief_insight: "A story about finding oneself through change.",
  analysis_status: "completed",
  analysis_error: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe("StoryInsights", () => {
  it("renders loading state correctly", () => {
    render(<StoryInsights metadata={null} isLoading={true} />);
    
    // Should show skeleton/loading UI
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders nothing when no metadata and not loading", () => {
    const { container } = render(<StoryInsights metadata={null} isLoading={false} />);
    
    expect(container.firstChild).toBeNull();
  });

  it("renders themes correctly", () => {
    render(<StoryInsights metadata={mockMetadata} />);
    
    expect(screen.getByText("growth")).toBeInTheDocument();
    expect(screen.getByText("reflection")).toBeInTheDocument();
  });

  it("renders emotional tone", () => {
    render(<StoryInsights metadata={mockMetadata} />);
    
    expect(screen.getByText("hopeful")).toBeInTheDocument();
  });

  it("renders brief insight", () => {
    render(<StoryInsights metadata={mockMetadata} />);
    
    expect(screen.getByText(/finding oneself/)).toBeInTheDocument();
  });

  it("shows key life moment indicator for high significance", () => {
    render(<StoryInsights metadata={mockMetadata} />);
    
    expect(screen.getByText("Key life moment")).toBeInTheDocument();
  });

  it("renders compact mode correctly", () => {
    render(<StoryInsights metadata={mockMetadata} compact={true} />);
    
    // Compact mode shows fewer themes
    expect(screen.getByText("growth")).toBeInTheDocument();
    expect(screen.queryByText("Story Insights")).not.toBeInTheDocument();
  });
});
```

#### 1.3 Integration Test

**File:** `__tests__/integration/story-analysis-flow.test.ts`

```typescript
import { describe, it, expect, vi } from "vitest";

describe("Story Analysis Integration Flow", () => {
  it("should create metadata record when story is saved", async () => {
    // This tests the full flow: save story → trigger analysis → metadata created
    // Implementation depends on your test infrastructure
  });

  it("should handle analysis failure gracefully", async () => {
    // Test that story save succeeds even if analysis fails
  });

  it("should update existing metadata on re-analysis", async () => {
    // Test upsert behavior
  });
});
```

**Run tests:**
```bash
npx vitest run
```

**Checkpoint:** ✅ All tests pass

---

### Step 2: Error Monitoring & Logging

**Priority:** 🔴 Critical | **Time:** 2-3 hours

#### 2.1 Create Analysis Logger Utility

**File:** `app/utils/analysisLogger.ts`

```typescript
type LogLevel = 'info' | 'warn' | 'error';

interface AnalysisLogEntry {
  level: LogLevel;
  storyId: string;
  action: string;
  duration?: number;
  error?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

class AnalysisLogger {
  private logs: AnalysisLogEntry[] = [];

  log(level: LogLevel, storyId: string, action: string, extra?: Partial<AnalysisLogEntry>) {
    const entry: AnalysisLogEntry = {
      level,
      storyId,
      action,
      timestamp: new Date().toISOString(),
      ...extra,
    };

    this.logs.push(entry);
    
    // Console output for development
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
    console.log(`${prefix} [Analysis] ${action} | Story: ${storyId}`, extra || '');

    // In production, send to logging service (e.g., Axiom, LogTail, Sentry)
    if (process.env.NODE_ENV === 'production' && level === 'error') {
      this.sendToLoggingService(entry);
    }
  }

  info(storyId: string, action: string, extra?: Partial<AnalysisLogEntry>) {
    this.log('info', storyId, action, extra);
  }

  warn(storyId: string, action: string, extra?: Partial<AnalysisLogEntry>) {
    this.log('warn', storyId, action, extra);
  }

  error(storyId: string, action: string, error: unknown, extra?: Partial<AnalysisLogEntry>) {
    this.log('error', storyId, action, {
      ...extra,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  private async sendToLoggingService(entry: AnalysisLogEntry) {
    // Implement based on your logging provider
    // Example: Sentry, LogTail, Axiom, etc.
  }

  getRecentLogs(count = 100): AnalysisLogEntry[] {
    return this.logs.slice(-count);
  }
}

export const analysisLogger = new AnalysisLogger();
```

#### 2.2 Update Analysis Endpoint with Logging

Add to `app/api/ai/analyze/route.ts`:

```typescript
import { analysisLogger } from "@/app/utils/analysisLogger";

// In POST handler, add logging:
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let storyId = 'unknown';

  try {
    const body = await request.json();
    storyId = body.storyId || 'unknown';

    analysisLogger.info(storyId, 'analysis_started');

    // ... existing logic ...

    const duration = Date.now() - startTime;
    analysisLogger.info(storyId, 'analysis_completed', { duration });

    return NextResponse.json({ success: true, metadata, processingTime: duration });

  } catch (error) {
    const duration = Date.now() - startTime;
    analysisLogger.error(storyId, 'analysis_failed', error, { duration });

    return NextResponse.json(
      { success: false, error: "Analysis failed" },
      { status: 500 }
    );
  }
}
```

**Checkpoint:** ✅ Errors are logged with context

---

### Step 3: Performance Baseline

**Priority:** 🟡 Medium | **Time:** 2 hours

#### 3.1 Create Performance Monitoring

**File:** `app/utils/performanceMonitor.ts`

```typescript
interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: string;
  success: boolean;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];

  record(operation: string, duration: number, success: boolean) {
    this.metrics.push({
      operation,
      duration,
      success,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 1000 metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  getStats(operation: string) {
    const relevant = this.metrics.filter(m => m.operation === operation);
    if (relevant.length === 0) return null;

    const durations = relevant.map(m => m.duration);
    const successful = relevant.filter(m => m.success);

    return {
      count: relevant.length,
      successRate: (successful.length / relevant.length) * 100,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      p50: this.percentile(durations, 50),
      p95: this.percentile(durations, 95),
      p99: this.percentile(durations, 99),
    };
  }

  private percentile(arr: number[], p: number): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }
}

export const perfMonitor = new PerformanceMonitor();
```

#### 3.2 Add API Endpoint for Stats

**File:** `app/api/admin/analysis-stats/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/supabaseServer";
import { perfMonitor } from "@/app/utils/performanceMonitor";

export async function GET(request: NextRequest) {
  // Basic auth check (improve for production)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  // Get database stats
  const { data: statusCounts } = await supabase
    .from('story_metadata')
    .select('analysis_status')
    .then(({ data }) => {
      const counts = { pending: 0, processing: 0, completed: 0, failed: 0 };
      data?.forEach(row => {
        counts[row.analysis_status as keyof typeof counts]++;
      });
      return { data: counts };
    });

  // Get performance stats
  const performanceStats = perfMonitor.getStats('story_analysis');

  return NextResponse.json({
    database: statusCounts,
    performance: performanceStats,
    timestamp: new Date().toISOString(),
  });
}
```

**Checkpoint:** ✅ Can monitor analysis success rate and latency

---

### Step 4: Edge Case Handling

**Priority:** 🟡 Medium | **Time:** 3 hours

#### 4.1 Handle Edge Cases in Analysis

Update `app/api/ai/analyze/route.ts`:

```typescript
// Add these edge case handlers

// 1. Handle very long content
const MAX_CONTENT_LENGTH = 10000;
const truncatedText = storyText.length > MAX_CONTENT_LENGTH 
  ? storyText.substring(0, MAX_CONTENT_LENGTH) + "... [truncated]"
  : storyText;

// 2. Handle non-English content (basic detection)
const hasNonLatinChars = /[^\u0000-\u007F]/.test(storyText);
if (hasNonLatinChars) {
  analysisLogger.info(storyId, 'non_latin_content_detected');
}

// 3. Handle content with excessive special characters
const specialCharRatio = (storyText.match(/[^a-zA-Z0-9\s]/g) || []).length / storyText.length;
if (specialCharRatio > 0.3) {
  analysisLogger.warn(storyId, 'high_special_char_ratio', { ratio: specialCharRatio });
}

// 4. Retry logic for transient failures
async function analyzeWithRetry(text: string, maxRetries = 2): Promise<AnalysisResponse> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      }
      return await callGemini(text);
    } catch (error) {
      lastError = error as Error;
      analysisLogger.warn(storyId, `analysis_retry_${attempt}`, { error: lastError.message });
    }
  }
  
  throw lastError;
}
```

#### 4.2 Handle UI Edge Cases

Update `components/StoryInsights.tsx`:

```typescript
// Handle incomplete metadata
if (metadata.analysis_status === 'failed') {
  return (
    <Card className="border-destructive/50">
      <CardContent className="py-4">
        <p className="text-sm text-muted-foreground">
          Unable to analyze this story. 
          <button 
            onClick={onRetry} 
            className="ml-2 text-primary underline"
          >
            Try again
          </button>
        </p>
      </CardContent>
    </Card>
  );
}

if (metadata.analysis_status === 'processing') {
  return (
    <Card>
      <CardContent className="py-4 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <p className="text-sm text-muted-foreground">Analyzing story...</p>
      </CardContent>
    </Card>
  );
}

// Handle empty themes
if (!metadata.themes?.length && !metadata.brief_insight) {
  return null; // Don't show empty insights card
}
```

**Checkpoint:** ✅ Edge cases handled gracefully

---

### Step 5: Database Optimization

**Priority:** 🟡 Medium | **Time:** 1-2 hours

#### 5.1 Add Missing Indexes (if needed)

```sql
-- Check existing indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'story_metadata';

-- Add composite index for common queries
CREATE INDEX IF NOT EXISTS idx_story_metadata_user_canonical 
ON story_metadata(story_id, is_canonical) 
WHERE is_canonical = TRUE;

-- Add index for status monitoring
CREATE INDEX IF NOT EXISTS idx_story_metadata_status_created 
ON story_metadata(analysis_status, created_at DESC);
```

#### 5.2 Verify RLS Performance

```sql
-- Test RLS policy performance
EXPLAIN ANALYZE
SELECT * FROM story_metadata 
WHERE story_id IN (
  SELECT id FROM stories WHERE author_wallet = 'test-wallet'
);
```

**Checkpoint:** ✅ Queries perform well with indexes

---

### Step 6: Documentation Update

**Priority:** 🟢 Low | **Time:** 1 hour

#### 6.1 Update CLAUDE.md

Mark Phase 1 as complete:

```markdown
### Phase 1: Story Metadata Foundation ✅ COMPLETE

**Completed:**
- [x] `story_metadata` table created with RLS
- [x] TypeScript types defined and exported
- [x] `/api/ai/analyze` endpoint working
- [x] Journal save triggers analysis
- [x] `StoryInsights` component displays metadata
- [x] `useStoryMetadata` hook working
- [x] Story detail page shows insights
- [x] Unit tests passing
- [x] Edge cases handled
- [x] Performance monitoring in place
```

**Checkpoint:** ✅ Documentation reflects current state

---

## Phase 1.5 Completion Checklist

- [ ] All unit tests passing
- [ ] Component tests passing
- [ ] Error logging implemented
- [ ] Performance monitoring in place
- [ ] Edge cases handled (long content, failures, retries)
- [ ] Database indexes optimized
- [ ] Documentation updated
- [ ] Manual QA completed (test 10 different story types)

---

# Phase 2: Patterns & Discovery

### 🎯 Objective
Enable users to see patterns across their stories through themes, life domains, and canonical story marking.

### Duration: 2-3 weeks

### Success Metrics
- [ ] Users can view stories grouped by theme
- [ ] Users can view stories grouped by life domain
- [ ] Users can mark stories as canonical
- [ ] Monthly summary displays correctly
- [ ] Navigation reflects new hierarchy

---

## Implementation Steps

### Step 1: Patterns Data Layer

**Priority:** 🔴 Critical | **Time:** 3-4 hours

#### 1.1 Create Patterns Hook

**File:** `app/hooks/usePatterns.ts`

```typescript
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useBrowserSupabase } from "./useBrowserSupabase";
import { StoryMetadata, LifeDomain } from "@/app/types/metadata";
import { StoryDataType } from "@/app/types";

interface StoryWithMetadata extends StoryDataType {
  story_metadata: StoryMetadata | null;
}

interface ThemeGroup {
  theme: string;
  stories: StoryWithMetadata[];
  count: number;
  latestDate: string;
}

interface DomainGroup {
  domain: LifeDomain;
  stories: StoryWithMetadata[];
  count: number;
  dominantTone: string | null;
}

interface MonthlySummary {
  month: string;
  year: number;
  storyCount: number;
  canonicalCount: number;
  topThemes: string[];
  dominantDomain: LifeDomain | null;
  dominantTone: string | null;
  avgSignificance: number;
}

interface UsePatternsReturn {
  // Data
  stories: StoryWithMetadata[];
  themeGroups: ThemeGroup[];
  domainGroups: DomainGroup[];
  canonicalStories: StoryWithMetadata[];
  monthlySummary: MonthlySummary | null;
  
  // State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  refetch: () => Promise<void>;
}

export function usePatterns(userWallet: string | null): UsePatternsReturn {
  const supabase = useBrowserSupabase();
  const [stories, setStories] = useState<StoryWithMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStories = useCallback(async () => {
    if (!userWallet || !supabase) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("stories")
        .select(`
          *,
          story_metadata (*)
        `)
        .eq("author_wallet", userWallet)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setStories((data as StoryWithMetadata[]) || []);
    } catch (err) {
      console.error("Error fetching patterns:", err);
      setError("Failed to load story patterns");
    } finally {
      setIsLoading(false);
    }
  }, [userWallet, supabase]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  // Compute theme groups
  const themeGroups = useMemo(() => {
    const groups = new Map<string, StoryWithMetadata[]>();

    stories.forEach(story => {
      const themes = story.story_metadata?.themes || [];
      themes.forEach(theme => {
        if (!groups.has(theme)) {
          groups.set(theme, []);
        }
        groups.get(theme)!.push(story);
      });
    });

    return Array.from(groups.entries())
      .map(([theme, themeStories]) => ({
        theme,
        stories: themeStories,
        count: themeStories.length,
        latestDate: themeStories[0]?.created_at || '',
      }))
      .sort((a, b) => b.count - a.count);
  }, [stories]);

  // Compute domain groups
  const domainGroups = useMemo(() => {
    const groups = new Map<LifeDomain, StoryWithMetadata[]>();

    stories.forEach(story => {
      const domain = story.story_metadata?.life_domain;
      if (domain) {
        if (!groups.has(domain)) {
          groups.set(domain, []);
        }
        groups.get(domain)!.push(story);
      }
    });

    return Array.from(groups.entries())
      .map(([domain, domainStories]) => {
        // Find dominant tone in this domain
        const tones = domainStories
          .map(s => s.story_metadata?.emotional_tone)
          .filter(Boolean);
        const toneCounts = tones.reduce((acc, tone) => {
          acc[tone!] = (acc[tone!] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        const dominantTone = Object.entries(toneCounts)
          .sort(([, a], [, b]) => b - a)[0]?.[0] || null;

        return {
          domain,
          stories: domainStories,
          count: domainStories.length,
          dominantTone,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [stories]);

  // Canonical stories
  const canonicalStories = useMemo(() => {
    return stories.filter(s => s.story_metadata?.is_canonical);
  }, [stories]);

  // Monthly summary (current month)
  const monthlySummary = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthStories = stories.filter(story => {
      const storyDate = new Date(story.created_at);
      return storyDate.getMonth() === currentMonth && 
             storyDate.getFullYear() === currentYear;
    });

    if (monthStories.length === 0) return null;

    // Aggregate themes
    const allThemes = monthStories.flatMap(s => s.story_metadata?.themes || []);
    const themeCounts = allThemes.reduce((acc, theme) => {
      acc[theme] = (acc[theme] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topThemes = Object.entries(themeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([theme]) => theme);

    // Dominant domain
    const domains = monthStories
      .map(s => s.story_metadata?.life_domain)
      .filter(Boolean);
    const domainCounts = domains.reduce((acc, domain) => {
      acc[domain!] = (acc[domain!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const dominantDomain = Object.entries(domainCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] as LifeDomain || null;

    // Dominant tone
    const tones = monthStories
      .map(s => s.story_metadata?.emotional_tone)
      .filter(Boolean);
    const toneCounts = tones.reduce((acc, tone) => {
      acc[tone!] = (acc[tone!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const dominantTone = Object.entries(toneCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || null;

    // Average significance
    const significanceScores = monthStories
      .map(s => s.story_metadata?.significance_score || 0);
    const avgSignificance = significanceScores.reduce((a, b) => a + b, 0) / significanceScores.length;

    return {
      month: now.toLocaleString('default', { month: 'long' }),
      year: currentYear,
      storyCount: monthStories.length,
      canonicalCount: monthStories.filter(s => s.story_metadata?.is_canonical).length,
      topThemes,
      dominantDomain,
      dominantTone,
      avgSignificance,
    };
  }, [stories]);

  return {
    stories,
    themeGroups,
    domainGroups,
    canonicalStories,
    monthlySummary,
    isLoading,
    error,
    refetch: fetchStories,
  };
}
```

**Checkpoint:** ✅ Hook returns grouped data correctly

---

### Step 2: Themes View Component

**Priority:** 🔴 Critical | **Time:** 3-4 hours

#### 2.1 Create Themes View

**File:** `components/patterns/ThemesView.tsx`

```typescript
"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Hash } from "lucide-react";
import { StoryCard } from "@/components/StoryCard";
import { cn } from "@/lib/utils";

interface ThemeGroup {
  theme: string;
  stories: any[];
  count: number;
  latestDate: string;
}

interface ThemesViewProps {
  themeGroups: ThemeGroup[];
  isLoading?: boolean;
}

const themeColors: Record<string, string> = {
  growth: "bg-green-500/10 text-green-600 border-green-500/20",
  reflection: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  change: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  loss: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  discovery: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  conflict: "bg-red-500/10 text-red-600 border-red-500/20",
  connection: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  transition: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  challenge: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

function getThemeColor(theme: string): string {
  return themeColors[theme.toLowerCase()] || "bg-muted text-muted-foreground";
}

export function ThemesView({ themeGroups, isLoading }: ThemesViewProps) {
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-32" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (themeGroups.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Hash className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No themes detected yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Keep writing stories and patterns will emerge.
          </p>
        </CardContent>
      </Card>
    );
  }

  const displayedGroups = showAll ? themeGroups : themeGroups.slice(0, 6);

  return (
    <div className="space-y-4">
      {/* Theme Pills Overview */}
      <div className="flex flex-wrap gap-2 mb-6">
        {themeGroups.slice(0, 10).map(group => (
          <Badge
            key={group.theme}
            variant="outline"
            className={cn(
              "cursor-pointer transition-all hover:scale-105",
              getThemeColor(group.theme),
              expandedTheme === group.theme && "ring-2 ring-primary"
            )}
            onClick={() => setExpandedTheme(
              expandedTheme === group.theme ? null : group.theme
            )}
          >
            {group.theme} ({group.count})
          </Badge>
        ))}
      </div>

      {/* Theme Cards */}
      <div className="grid gap-4">
        {displayedGroups.map(group => (
          <Card 
            key={group.theme}
            className={cn(
              "transition-all",
              expandedTheme === group.theme && "ring-2 ring-primary"
            )}
          >
            <CardHeader 
              className="cursor-pointer"
              onClick={() => setExpandedTheme(
                expandedTheme === group.theme ? null : group.theme
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={getThemeColor(group.theme)}>
                    {group.theme}
                  </Badge>
                  <CardTitle className="text-lg">
                    {group.count} {group.count === 1 ? 'story' : 'stories'}
                  </CardTitle>
                </div>
                {expandedTheme === group.theme ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>

            {expandedTheme === group.theme && (
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {group.stories.slice(0, 4).map(story => (
                    <StoryCard key={story.id} story={story} compact />
                  ))}
                </div>
                {group.stories.length > 4 && (
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    +{group.stories.length - 4} more stories
                  </p>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Show More Button */}
      {themeGroups.length > 6 && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? "Show Less" : `Show All ${themeGroups.length} Themes`}
        </Button>
      )}
    </div>
  );
}
```

**Checkpoint:** ✅ Themes view renders and expands correctly

---

### Step 3: Life Domains View

**Priority:** 🔴 Critical | **Time:** 3 hours

#### 3.1 Create Domains View

**File:** `components/patterns/DomainsView.tsx`

```typescript
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Briefcase, Heart, Activity, User, Sprout, 
  Palette, Sparkles, Users, Compass, BookOpen 
} from "lucide-react";
import { LifeDomain } from "@/app/types/metadata";
import { cn } from "@/lib/utils";

interface DomainGroup {
  domain: LifeDomain;
  stories: any[];
  count: number;
  dominantTone: string | null;
}

interface DomainsViewProps {
  domainGroups: DomainGroup[];
  totalStories: number;
  isLoading?: boolean;
}

const domainConfig: Record<LifeDomain, { icon: any; color: string; label: string }> = {
  work: { icon: Briefcase, color: "text-blue-500", label: "Work & Career" },
  relationships: { icon: Heart, color: "text-pink-500", label: "Relationships" },
  health: { icon: Activity, color: "text-green-500", label: "Health & Wellness" },
  identity: { icon: User, color: "text-purple-500", label: "Identity & Self" },
  growth: { icon: Sprout, color: "text-emerald-500", label: "Personal Growth" },
  creativity: { icon: Palette, color: "text-orange-500", label: "Creativity" },
  spirituality: { icon: Sparkles, color: "text-indigo-500", label: "Spirituality" },
  family: { icon: Users, color: "text-rose-500", label: "Family" },
  adventure: { icon: Compass, color: "text-amber-500", label: "Adventure" },
  learning: { icon: BookOpen, color: "text-cyan-500", label: "Learning" },
};

export function DomainsView({ domainGroups, totalStories, isLoading }: DomainsViewProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="py-6">
              <div className="h-8 bg-muted rounded w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (domainGroups.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Compass className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No life domains detected yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Your stories will be categorized as you write more.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Domain Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Life Domain Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {domainGroups.map(group => {
            const config = domainConfig[group.domain];
            const Icon = config.icon;
            const percentage = totalStories > 0 
              ? Math.round((group.count / totalStories) * 100)
              : 0;

            return (
              <div key={group.domain} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("w-4 h-4", config.color)} />
                    <span className="text-sm font-medium">{config.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {group.count} stories
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {percentage}%
                    </Badge>
                  </div>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Domain Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {domainGroups.map(group => {
          const config = domainConfig[group.domain];
          const Icon = config.icon;

          return (
            <Card key={group.domain} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    config.color.replace("text-", "bg-").replace("500", "500/10")
                  )}>
                    <Icon className={cn("w-5 h-5", config.color)} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{config.label}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {group.count} {group.count === 1 ? 'story' : 'stories'}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {group.dominantTone && (
                  <p className="text-sm text-muted-foreground">
                    Dominant mood: <span className="capitalize">{group.dominantTone}</span>
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-1">
                  {group.stories.slice(0, 3).map(story => (
                    <Badge key={story.id} variant="outline" className="text-xs">
                      {story.title?.substring(0, 20) || "Untitled"}...
                    </Badge>
                  ))}
                  {group.stories.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{group.stories.length - 3}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
```

**Checkpoint:** ✅ Domains view shows distribution correctly

---

### Step 4: Canonical Story Feature

**Priority:** 🔴 Critical | **Time:** 2-3 hours

#### 4.1 Create Canonical Badge Component

**File:** `components/CanonicalBadge.tsx`

```typescript
"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useStoryMetadata } from "@/app/hooks/useStoryMetadata";
import { toast } from "sonner";

interface CanonicalBadgeProps {
  storyId: string;
  isAuthor: boolean;
  initialValue?: boolean;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function CanonicalBadge({
  storyId,
  isAuthor,
  initialValue = false,
  showLabel = true,
  size = "md",
}: CanonicalBadgeProps) {
  const { metadata, markAsCanonical } = useStoryMetadata(storyId);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const isCanonical = metadata?.is_canonical ?? initialValue;

  const handleToggle = async () => {
    if (!isAuthor) return;
    
    setIsUpdating(true);
    try {
      await markAsCanonical(!isCanonical);
      toast.success(
        isCanonical 
          ? "Removed from key moments" 
          : "Marked as key moment"
      );
    } catch (error) {
      toast.error("Failed to update. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const sizeClasses = {
    sm: "h-7 text-xs gap-1",
    md: "h-9 text-sm gap-1.5",
    lg: "h-11 text-base gap-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  // Display-only badge for non-authors
  if (!isAuthor) {
    if (!isCanonical) return null;
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "inline-flex items-center px-2 py-1 rounded-full",
              "bg-amber-500/10 text-amber-600",
              sizeClasses[size]
            )}>
              <Star className={cn(iconSizes[size], "fill-current")} />
              {showLabel && <span>Key Moment</span>}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>The author marked this as an important story</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Interactive button for authors
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isCanonical ? "default" : "outline"}
            size="sm"
            onClick={handleToggle}
            disabled={isUpdating}
            className={cn(
              sizeClasses[size],
              isCanonical && "bg-amber-500 hover:bg-amber-600 text-white",
              !isCanonical && "hover:bg-amber-500/10 hover:text-amber-600"
            )}
          >
            <Star className={cn(
              iconSizes[size],
              isCanonical && "fill-current"
            )} />
            {showLabel && (
              <span>{isCanonical ? "Key Moment" : "Mark as Key Moment"}</span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isCanonical 
              ? "This is marked as an important story in your life"
              : "Mark this story as a key moment in your life"
            }
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

#### 4.2 Add to Story Detail Page

In `app/story/[storyId]/page.tsx`, add:

```typescript
import { CanonicalBadge } from "@/components/CanonicalBadge";

// In the story header section:
<div className="flex items-center gap-3">
  <h1>{story.title}</h1>
  <CanonicalBadge 
    storyId={story.id}
    isAuthor={isAuthor}
  />
</div>
```

**Checkpoint:** ✅ Canonical marking works, persists to database

---

### Step 5: Monthly Summary Component

**Priority:** 🟡 Medium | **Time:** 2-3 hours

#### 5.1 Create Monthly Summary

**File:** `components/patterns/MonthlySummary.tsx`

```typescript
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Star, Brain } from "lucide-react";
import { LifeDomain } from "@/app/types/metadata";

interface MonthlySummaryProps {
  summary: {
    month: string;
    year: number;
    storyCount: number;
    canonicalCount: number;
    topThemes: string[];
    dominantDomain: LifeDomain | null;
    dominantTone: string | null;
    avgSignificance: number;
  } | null;
  isLoading?: boolean;
}

export function MonthlySummary({ summary, isLoading }: MonthlySummaryProps) {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary || summary.storyCount === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <Calendar className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No stories this month yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Start journaling to see your monthly patterns.
          </p>
        </CardContent>
      </Card>
    );
  }

  const significanceLabel = summary.avgSignificance > 0.7 
    ? "Significant month" 
    : summary.avgSignificance > 0.4 
      ? "Moderate activity"
      : "Routine reflections";

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {summary.month} {summary.year}
          </CardTitle>
          <Badge variant="secondary">
            {summary.storyCount} {summary.storyCount === 1 ? 'story' : 'stories'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{summary.storyCount}</div>
            <div className="text-xs text-muted-foreground">Stories</div>
          </div>
          <div>
            <div className="text-2xl font-bold flex items-center justify-center gap-1">
              <Star className="w-4 h-4 text-amber-500" />
              {summary.canonicalCount}
            </div>
            <div className="text-xs text-muted-foreground">Key Moments</div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {Math.round(summary.avgSignificance * 100)}%
            </div>
            <div className="text-xs text-muted-foreground">Significance</div>
          </div>
        </div>

        {/* Top Themes */}
        {summary.topThemes.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Brain className="w-4 h-4" />
              Top Themes
            </div>
            <div className="flex flex-wrap gap-1">
              {summary.topThemes.map(theme => (
                <Badge key={theme} variant="outline">
                  {theme}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Dominant Domain & Tone */}
        <div className="flex gap-4 text-sm">
          {summary.dominantDomain && (
            <div>
              <span className="text-muted-foreground">Focus: </span>
              <span className="capitalize">{summary.dominantDomain}</span>
            </div>
          )}
          {summary.dominantTone && (
            <div>
              <span className="text-muted-foreground">Mood: </span>
              <span className="capitalize">{summary.dominantTone}</span>
            </div>
          )}
        </div>

        {/* Significance Indicator */}
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span>{significanceLabel}</span>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Checkpoint:** ✅ Monthly summary renders with correct data

---

### Step 6: Updated Library Page

**Priority:** 🔴 Critical | **Time:** 3-4 hours

#### 6.1 Refactor Library with Tabs

**File:** `app/library/page.tsx` (major update)

```typescript
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePatterns } from "@/app/hooks/usePatterns";
import { useAccount } from "wagmi";
import { ThemesView } from "@/components/patterns/ThemesView";
import { DomainsView } from "@/components/patterns/DomainsView";
import { MonthlySummary } from "@/components/patterns/MonthlySummary";
import { StoryCard } from "@/components/StoryCard";
import { BookOpen, Hash, Compass, Star, Clock } from "lucide-react";

export default function LibraryPage() {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState("all");
  
  const {
    stories,
    themeGroups,
    domainGroups,
    canonicalStories,
    monthlySummary,
    isLoading,
    error,
  } = usePatterns(address || null);

  if (!address) {
    return (
      <div className="container py-8 text-center">
        <p className="text-muted-foreground">Connect your wallet to view your library.</p>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Archive</h1>
          <p className="text-muted-foreground">
            {stories.length} stories · {canonicalStories.length} key moments
          </p>
        </div>
      </div>

      {/* Monthly Summary */}
      <MonthlySummary summary={monthlySummary} isLoading={isLoading} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">All Stories</span>
          </TabsTrigger>
          <TabsTrigger value="canonical" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            <span className="hidden sm:inline">Key Moments</span>
          </TabsTrigger>
          <TabsTrigger value="themes" className="flex items-center gap-2">
            <Hash className="w-4 h-4" />
            <span className="hidden sm:inline">Themes</span>
          </TabsTrigger>
          <TabsTrigger value="domains" className="flex items-center gap-2">
            <Compass className="w-4 h-4" />
            <span className="hidden sm:inline">Life Areas</span>
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Recent</span>
          </TabsTrigger>
        </TabsList>

        {/* All Stories */}
        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stories.map(story => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Key Moments */}
        <TabsContent value="canonical" className="mt-6">
          {canonicalStories.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No key moments marked yet.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Mark important stories to highlight them here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {canonicalStories.map(story => (
                <StoryCard key={story.id} story={story} featured />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Themes */}
        <TabsContent value="themes" className="mt-6">
          <ThemesView themeGroups={themeGroups} isLoading={isLoading} />
        </TabsContent>

        {/* Life Domains */}
        <TabsContent value="domains" className="mt-6">
          <DomainsView 
            domainGroups={domainGroups} 
            totalStories={stories.length}
            isLoading={isLoading} 
          />
        </TabsContent>

        {/* Recent */}
        <TabsContent value="recent" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stories.slice(0, 12).map(story => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Checkpoint:** ✅ Library page has all tabs working

---

### Step 7: Navigation Update

**Priority:** 🟡 Medium | **Time:** 1 hour

#### 7.1 Update Navigation Hierarchy

**File:** `components/Navigation.tsx` — Reorder items:

```typescript
const navItems = [
  { href: "/record", label: "Record", icon: Mic },
  { href: "/library", label: "Archive", icon: BookOpen },  // Renamed from Library
  { href: "/social", label: "Community", icon: Users },    // Renamed from Social
  { href: "/profile", label: "Profile", icon: User },
];
```

**Checkpoint:** ✅ Navigation reflects new hierarchy

---

## Phase 2 Completion Checklist

- [ ] `usePatterns` hook returns correct grouped data
- [ ] `ThemesView` component renders and expands
- [ ] `DomainsView` component shows distribution
- [ ] `CanonicalBadge` component toggles correctly
- [ ] `MonthlySummary` component displays stats
- [ ] Library page has all tabs working
- [ ] Navigation updated (Archive > Community)
- [ ] All tests passing
- [ ] Performance acceptable (< 2s load time)
- [ ] Manual QA completed

---

## Success Metrics for Phase 2

- Users can view stories grouped by theme
- Users can view stories grouped by life domain
- Users can mark/unmark stories as canonical
- Monthly summary displays on library page
- Tab navigation works smoothly
- No performance regressions

---

*Phase 2 builds directly on Phase 1's metadata foundation.*
*After Phase 2, users have a complete self-understanding interface.*