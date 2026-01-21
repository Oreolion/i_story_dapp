# iStory Implementation Prompt — Phase 1.5: Validation & Hardening

> **For Claude Code with Extended Thinking Enabled**
> **Project:** iStory Cognitive Layer
> **Current State:** Phase 1 Complete (Story Metadata Foundation)
> **Active Phase:** 1.5 — Validation & Hardening
> **Next Phase:** Phase 2 — Patterns & Discovery (DO NOT START UNTIL PHASE 1.5 COMPLETE)

---

## 🎯 Current Mission: Phase 1.5 ONLY

**DO NOT proceed to Phase 2 until Phase 1.5 is fully complete and verified.**

Phase 1.5 focuses on:
1. Automated test coverage for Phase 1 code
2. Error monitoring and logging infrastructure
3. Performance tracking and baselines
4. Edge case hardening
5. Database optimization
6. Documentation updates

**Duration:** 3-5 days
**Goal:** Production-ready foundation before adding new features

---

## 🤖 Claude SDK Thinking Agent Protocol

When you encounter complex problems that require deep analysis, spawn a thinking agent using the Claude SDK. This is for:

- Architectural decisions with multiple valid approaches
- Debugging persistent issues after 2+ failed attempts
- Performance optimization strategies
- Security considerations
- Complex algorithm design

### When to Spawn a Thinking Agent

```
TRIGGER CONDITIONS:
1. You've attempted a solution 2+ times without success
2. You're unsure which of multiple approaches is best
3. The problem involves complex trade-offs
4. You need to reason about edge cases systematically
5. You're implementing security-sensitive code
6. You're optimizing performance-critical paths
```

### How to Use Claude SDK for Thinking

```typescript
// File: scripts/think.ts
// Run with: npx ts-node scripts/think.ts "your problem description"

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

interface ThinkingRequest {
  problem: string;
  context: string;
  constraints: string[];
  currentApproach?: string;
  failedAttempts?: string[];
}

async function thinkDeep(request: ThinkingRequest): Promise<string> {
  const systemPrompt = `You are a senior software architect and PhD-level engineer. 
Your role is to think deeply about complex problems and provide well-reasoned solutions.

When analyzing a problem:
1. Restate the problem to ensure understanding
2. Identify all constraints and requirements
3. Consider multiple approaches (at least 3)
4. Analyze trade-offs of each approach
5. Recommend the best approach with justification
6. Provide implementation guidance
7. Identify potential pitfalls and how to avoid them

Be thorough, precise, and practical.`;

  const userPrompt = `
## Problem
${request.problem}

## Context
${request.context}

## Constraints
${request.constraints.map((c, i) => `${i + 1}. ${c}`).join("\n")}

${request.currentApproach ? `## Current Approach\n${request.currentApproach}` : ""}

${request.failedAttempts?.length ? `## Failed Attempts\n${request.failedAttempts.map((a, i) => `${i + 1}. ${a}`).join("\n")}` : ""}

Please analyze this problem deeply and provide a recommended solution.
`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 16000,
    thinking: {
      type: "enabled",
      budget_tokens: 10000, // Allow extensive thinking
    },
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  // Extract thinking and response
  let thinking = "";
  let answer = "";

  for (const block of response.content) {
    if (block.type === "thinking") {
      thinking = block.thinking;
    } else if (block.type === "text") {
      answer = block.text;
    }
  }

  return `
## Thinking Process
${thinking}

## Recommended Solution
${answer}
`;
}

// CLI usage
const problem = process.argv[2];
if (!problem) {
  console.error("Usage: npx ts-node scripts/think.ts 'problem description'");
  process.exit(1);
}

// Example with full context
thinkDeep({
  problem: problem,
  context: `
    iStory is a Web3 AI-powered journaling dApp.
    Tech stack: Next.js 15, React 19, Supabase, Gemini AI, Base blockchain.
    Currently implementing Phase 1.5: Validation & Hardening.
    Phase 1 (Story Metadata) is complete - we have automatic story analysis.
  `,
  constraints: [
    "Must maintain backward compatibility",
    "Must not break existing functionality",
    "Must follow existing code patterns in the project",
    "Performance must not degrade",
    "Must work with Supabase RLS policies",
  ],
}).then(console.log).catch(console.error);
```

### Create the Thinking Script First

Before starting Phase 1.5 tasks, create this utility:

```bash
# Install Claude SDK if not present
npm install @anthropic-ai/sdk

# Create the script
# (Create scripts/think.ts with the code above)
```

### Usage During Implementation

When you hit a complex problem:

```bash
# Example: Debugging a persistent test failure
npx ts-node scripts/think.ts "My Vitest mock for Supabase is not working. 
The mock is defined but the actual Supabase client is still being called. 
I've tried vi.mock() at the top of the file and in beforeEach. 
The test file imports from @/app/utils/supabase/supabaseServer."

# Example: Architectural decision
npx ts-node scripts/think.ts "Should I implement retry logic with exponential 
backoff inside the analyze endpoint, or create a separate queue system with 
a cron job? The endpoint currently processes synchronously."

# Example: Performance optimization
npx ts-node scripts/think.ts "The usePatterns hook is re-computing themeGroups 
on every render even though the stories array hasn't changed. How should I 
structure the memoization to prevent unnecessary recomputation?"
```

### Integrate Thinking Results

After running the thinking agent:
1. Read the analysis carefully
2. Extract the recommended approach
3. Implement the solution
4. Verify it works
5. Document what you learned

---

## 📚 Required Reading (Execute First)

Before writing ANY code, read these files in order:

```
<read_sequence>
1. CLAUDE.md                      — Architecture, conventions, current state
2. PLAN_PHASE1.5_AND_PHASE2.md   — Detailed Phase 1.5 specifications  
3. app/types/metadata.ts          — Type definitions from Phase 1
4. app/api/ai/analyze/route.ts    — Analysis endpoint to test
5. components/StoryInsights.tsx   — Component to test
6. app/hooks/useStoryMetadata.ts  — Hook to test
</read_sequence>
```

**After reading, confirm understanding:**
- What does the analyze endpoint do?
- What edge cases exist in current implementation?
- What types are defined for metadata?
- What is the current error handling approach?

---

## 🧠 Thinking Protocol

For EACH task, follow this sequence:

### Pre-Implementation (Always Do This)

```xml
<think>
1. WHAT exactly am I building/testing?
2. WHAT files need to be created or modified?
3. WHAT are the inputs and expected outputs?
4. WHAT could go wrong? (List at least 5 edge cases)
5. WHAT existing patterns should I follow?
6. DO I need to spawn a thinking agent for this?
</think>
```

### When Stuck (Spawn Thinking Agent)

```xml
<stuck>
Problem: [Describe the issue]
Attempts: [What I've tried]
Constraint: [What must be maintained]

ACTION: Run thinking agent
npx ts-node scripts/think.ts "[problem description]"
</stuck>
```

### Post-Implementation (Always Do This)

```xml
<verify>
1. TypeScript: npx tsc --noEmit ✅/❌
2. Lint: npm run lint ✅/❌
3. Build: npm run build ✅/❌
4. Tests: npx vitest run ✅/❌
5. Manual test: [description] ✅/❌
</verify>
```

---

## 📋 Phase 1.5 Tasks

### Task 1.5.0: Setup Thinking Agent Utility

<task id="1.5.0">
<objective>Create Claude SDK thinking agent script</objective>
<priority>FIRST — Do this before anything else</priority>

<steps>
1. Verify @anthropic-ai/sdk is installed (check package.json)
2. If not installed: `npm install @anthropic-ai/sdk`
3. Create `scripts/think.ts` with the code provided above
4. Verify ANTHROPIC_API_KEY is in .env.local
5. Test with: `npx ts-node scripts/think.ts "test problem"`
</steps>

<acceptance_criteria>
- [ ] @anthropic-ai/sdk in package.json
- [ ] scripts/think.ts exists and is valid TypeScript
- [ ] ANTHROPIC_API_KEY configured
- [ ] Test run returns thinking + solution
</acceptance_criteria>

<on_completion>
Report: "Task 1.5.0 complete. Thinking agent ready."
</on_completion>
</task>

---

### Task 1.5.1: Test Infrastructure for Analyze Endpoint

<task id="1.5.1">
<objective>Create comprehensive test suite for /api/ai/analyze</objective>

<file_to_create>
__tests__/api/analyze.test.ts
</file_to_create>

<test_cases_required>
```typescript
describe('POST /api/ai/analyze', () => {
  // Input validation
  it('returns 400 when storyId is missing');
  it('returns 400 when storyText is missing');
  it('returns 400 when storyText is too short (<50 chars)');
  it('returns 400 when storyId is not a valid UUID');
  
  // Success cases
  it('returns 200 with valid metadata for normal story');
  it('truncates content over 10000 characters');
  it('handles stories with special characters');
  it('handles stories with non-English content');
  
  // Gemini integration
  it('parses valid Gemini JSON response');
  it('handles Gemini response with markdown code blocks');
  it('uses fallback values for invalid emotional_tone');
  it('uses fallback values for invalid life_domain');
  it('clamps scores to 0-1 range');
  
  // Database operations  
  it('creates new metadata record');
  it('updates existing metadata record (upsert)');
  it('sets analysis_status to completed on success');
  it('sets analysis_status to failed on error');
  
  // Error handling
  it('handles Gemini API timeout');
  it('handles Gemini API rate limit');
  it('handles database write failure');
  it('handles malformed JSON from Gemini');
});

describe('GET /api/ai/analyze', () => {
  it('returns 400 when storyId param is missing');
  it('returns 404 when metadata not found');
  it('returns 200 with metadata when found');
});
```
</test_cases_required>

<mocking_strategy>
```typescript
// Mock Supabase
vi.mock('@/app/utils/supabase/supabaseServer', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// Mock Gemini
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(() => mockGeminiClient),
}));

// Create configurable mocks that can be adjusted per test
const mockSupabaseClient = {
  from: vi.fn(() => ({
    upsert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  })),
};
```
</mocking_strategy>

<if_stuck>
Spawn thinking agent:
```bash
npx ts-node scripts/think.ts "How do I properly mock Supabase client chain 
methods (from().upsert().select().single()) in Vitest so I can test different 
responses for different test cases?"
```
</if_stuck>

<acceptance_criteria>
- [ ] All test cases listed above are implemented
- [ ] Mocks are properly configured
- [ ] Tests run without errors: `npx vitest run __tests__/api/analyze.test.ts`
- [ ] All tests pass
- [ ] Coverage > 80% for analyze route
</acceptance_criteria>

<verification>
```bash
npx vitest run __tests__/api/analyze.test.ts --reporter=verbose
npx vitest run __tests__/api/analyze.test.ts --coverage
```
</verification>

<on_completion>
Report status with:
- Number of tests written
- Number passing
- Coverage percentage
- Any issues encountered
</on_completion>
</task>

---

### Task 1.5.2: Test Infrastructure for Components

<task id="1.5.2">
<objective>Create test suite for StoryInsights component and useStoryMetadata hook</objective>

<files_to_create>
- __tests__/components/StoryInsights.test.tsx
- __tests__/hooks/useStoryMetadata.test.ts
</files_to_create>

<component_test_cases>
```typescript
describe('StoryInsights', () => {
  // Render states
  it('renders loading skeleton when isLoading=true');
  it('renders nothing when metadata=null and not loading');
  it('renders nothing when analysis_status=pending');
  it('renders processing state when analysis_status=processing');
  it('renders error state with retry when analysis_status=failed');
  
  // Content rendering
  it('renders brief_insight in quotes');
  it('renders all themes as badges');
  it('renders emotional_tone with correct color');
  it('renders life_domain with icon');
  it('renders people_mentioned when present');
  it('renders places_mentioned when present');
  it('shows "Key life moment" when significance_score > 0.7');
  
  // Compact mode
  it('renders compact mode with limited themes');
  it('hides detailed sections in compact mode');
  
  // Interactions
  it('calls onRetry when retry button clicked');
});
```
</component_test_cases>

<hook_test_cases>
```typescript
describe('useStoryMetadata', () => {
  it('returns loading=true initially');
  it('fetches metadata on mount');
  it('returns metadata after fetch');
  it('returns null when metadata not found (PGRST116)');
  it('sets error on fetch failure');
  it('refetch function triggers new fetch');
  it('markAsCanonical updates database');
  it('markAsCanonical updates local state optimistically');
  it('markAsCanonical reverts on error');
  it('does nothing when storyId is null');
  it('does nothing when supabase is null');
});
```
</hook_test_cases>

<acceptance_criteria>
- [ ] All component test cases implemented
- [ ] All hook test cases implemented
- [ ] Tests use @testing-library/react properly
- [ ] Tests pass: `npx vitest run __tests__/components __tests__/hooks`
</acceptance_criteria>

<on_completion>
Report status with test counts and any issues.
</on_completion>
</task>

---

### Task 1.5.3: Observability Layer

<task id="1.5.3">
<objective>Implement logging and performance monitoring</objective>

<files_to_create>
- app/utils/analysisLogger.ts
- app/utils/performanceMonitor.ts  
- app/api/admin/analysis-stats/route.ts
</files_to_create>

<files_to_modify>
- app/api/ai/analyze/route.ts (add logging calls)
</files_to_modify>

<logger_requirements>
```typescript
interface AnalysisLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  storyId: string;
  action: string;
  duration?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

// Required methods
logger.info(storyId, action, metadata?)
logger.warn(storyId, action, metadata?)  
logger.error(storyId, action, error, metadata?)
logger.getRecentLogs(count): AnalysisLog[]
```
</logger_requirements>

<performance_monitor_requirements>
```typescript
interface PerformanceStats {
  operation: string;
  count: number;
  successRate: number;
  avgDuration: number;
  p50: number;
  p95: number;
  p99: number;
}

// Required methods
monitor.record(operation, duration, success)
monitor.getStats(operation): PerformanceStats | null
```
</performance_monitor_requirements>

<admin_endpoint_requirements>
- Protected with ADMIN_SECRET header
- Returns analysis status counts from database
- Returns performance stats from monitor
- Returns recent error logs
</admin_endpoint_requirements>

<acceptance_criteria>
- [ ] Logger created with all required methods
- [ ] Performance monitor created with percentile calculations
- [ ] Admin endpoint protected and returns stats
- [ ] Analyze endpoint logs all operations
- [ ] Errors include full context for debugging
</acceptance_criteria>

<verification>
```bash
# Create a test story and check logs
curl -X POST http://localhost:3000/api/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{"storyId": "test-123", "storyText": "This is a test story..."}'

# Check admin stats
curl http://localhost:3000/api/admin/analysis-stats \
  -H "Authorization: Bearer $ADMIN_SECRET"
```
</verification>
</task>

---

### Task 1.5.4: Edge Case Hardening

<task id="1.5.4">
<objective>Handle all edge cases gracefully in analysis pipeline</objective>

<file_to_modify>
app/api/ai/analyze/route.ts
</file_to_modify>

<edge_cases_to_handle>

1. **Long Content**
   - Truncate at 10,000 characters
   - Add "[truncated]" indicator
   - Log warning

2. **Retry Logic**
   - 3 attempts max
   - Exponential backoff: 1s, 2s, 4s
   - Different error types: timeout vs rate limit vs other

3. **Invalid Gemini Response**
   - Handle non-JSON response
   - Handle partial JSON
   - Handle missing required fields
   - Use safe defaults

4. **Concurrent Analysis**
   - Check if already processing
   - Skip or queue duplicate requests

5. **Rate Limiting**
   - Track requests per minute
   - Return 429 if exceeded
   - Include retry-after header

</edge_cases_to_handle>

<implementation_pattern>
```typescript
async function analyzeWithRetry(
  storyId: string,
  text: string,
  maxRetries = 3
): Promise<AnalysisResponse> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      analysisLogger.info(storyId, `attempt_${attempt}`);
      
      const result = await callGemini(text);
      
      analysisLogger.info(storyId, 'gemini_success', { attempt });
      return result;
      
    } catch (error) {
      lastError = error as Error;
      analysisLogger.warn(storyId, `attempt_${attempt}_failed`, {
        error: lastError.message,
        willRetry: attempt < maxRetries,
      });
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}
```
</implementation_pattern>

<if_stuck>
Spawn thinking agent for complex retry/circuit-breaker patterns:
```bash
npx ts-node scripts/think.ts "What's the best pattern for handling 
Gemini API failures in a Next.js API route? Should I use retry with 
backoff, circuit breaker, or a queue system? Consider: user experience, 
cost, complexity, and reliability."
```
</if_stuck>

<acceptance_criteria>
- [ ] Long content truncated with warning log
- [ ] Retry logic with exponential backoff implemented
- [ ] Invalid JSON from Gemini handled with fallbacks
- [ ] Concurrent request handling (skip duplicates)
- [ ] All edge cases have corresponding tests
- [ ] No unhandled promise rejections possible
</acceptance_criteria>

<verification>
```bash
# Test long content
node -e "console.log(JSON.stringify({storyId:'test',storyText:'x'.repeat(15000)}))" | \
  curl -X POST http://localhost:3000/api/ai/analyze \
  -H "Content-Type: application/json" -d @-

# Test retry (temporarily break Gemini key)
# Observe retry logs in console
```
</verification>
</task>

---

### Task 1.5.5: UI Edge Case Handling

<task id="1.5.5">
<objective>Handle all analysis states in StoryInsights component</objective>

<file_to_modify>
components/StoryInsights.tsx
</file_to_modify>

<states_to_handle>
1. `analysis_status = 'pending'` → Show "Analysis queued..."
2. `analysis_status = 'processing'` → Show spinner + "Analyzing..."
3. `analysis_status = 'failed'` → Show error + retry button
4. `analysis_status = 'completed'` but empty themes → Show minimal view
5. `metadata = null` → Show nothing (not yet analyzed)
</states_to_handle>

<add_retry_functionality>
```typescript
interface StoryInsightsProps {
  metadata: StoryMetadata | null;
  storyId: string;  // Add this
  isLoading?: boolean;
  compact?: boolean;
  onRetryAnalysis?: () => Promise<void>;  // Add this
}

// Retry handler
const handleRetry = async () => {
  setRetrying(true);
  try {
    await fetch(`/api/ai/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storyId, storyText: /* need to pass this */ }),
    });
    onRetryAnalysis?.();
  } catch (error) {
    toast.error('Retry failed. Please try again.');
  } finally {
    setRetrying(false);
  }
};
```
</add_retry_functionality>

<acceptance_criteria>
- [ ] All 5 states render correctly
- [ ] Retry button triggers re-analysis
- [ ] Loading state during retry
- [ ] Error toast on retry failure
- [ ] Success triggers refetch of metadata
</acceptance_criteria>
</task>

---

### Task 1.5.6: Database Optimization

<task id="1.5.6">
<objective>Verify and optimize database performance</objective>

<verification_queries>
```sql
-- 1. Check existing indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'story_metadata';

-- 2. Check query plans
EXPLAIN ANALYZE 
SELECT * FROM story_metadata WHERE story_id = '[any-uuid]';

EXPLAIN ANALYZE
SELECT * FROM story_metadata WHERE is_canonical = true;

EXPLAIN ANALYZE
SELECT * FROM story_metadata WHERE 'growth' = ANY(themes);

EXPLAIN ANALYZE
SELECT sm.*, s.title, s.content
FROM story_metadata sm
JOIN stories s ON s.id = sm.story_id
WHERE s.author_wallet = '[test-wallet]';

-- 3. Check for missing indexes
-- If any query shows "Seq Scan" on large tables, add index
```
</verification_queries>

<indexes_to_verify>
```sql
-- These should exist (created in Phase 1)
idx_story_metadata_story_id
idx_story_metadata_themes (GIN)
idx_story_metadata_domain
idx_story_metadata_canonical

-- Add if missing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_story_metadata_status 
ON story_metadata(analysis_status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_story_metadata_created
ON story_metadata(created_at DESC);
```
</indexes_to_verify>

<acceptance_criteria>
- [ ] All expected indexes exist
- [ ] No Seq Scans on indexed columns
- [ ] Join queries use indexes
- [ ] Query times < 100ms for single record lookups
</acceptance_criteria>
</task>

---

### Task 1.5.7: Documentation Update

<task id="1.5.7">
<objective>Update CLAUDE.md to reflect Phase 1.5 completion</objective>

<file_to_modify>
CLAUDE.md
</file_to_modify>

<updates_required>
1. Mark Phase 1 as ✅ COMPLETE
2. Mark Phase 1.5 as ✅ COMPLETE
3. Add new utilities to documentation:
   - analysisLogger
   - performanceMonitor
   - admin/analysis-stats endpoint
   - scripts/think.ts
4. Update "Current Phase" to Phase 2
5. Document any deviations from original plan
</updates_required>

<acceptance_criteria>
- [ ] Phase 1 marked complete with checklist
- [ ] Phase 1.5 marked complete with checklist
- [ ] New utilities documented
- [ ] Current phase updated
</acceptance_criteria>
</task>

---

## 🔄 Feedback Loop

After EACH task:

### 1. Verification Commands
```bash
npx tsc --noEmit          # Type check
npm run lint              # Lint
npm run build             # Build
npx vitest run            # Tests
```

### 2. Status Report Format
```markdown
## Task [1.5.X] Complete

### Files Created/Modified
- [list files]

### Tests
- Written: X
- Passing: X
- Coverage: X%

### Verification
- TypeScript: ✅/❌
- Lint: ✅/❌
- Build: ✅/❌
- Tests: ✅/❌

### Thinking Agent Used
- [Yes/No]
- [If yes, for what problem?]

### Issues Encountered
- [Any blockers or concerns]

### Ready for Next Task: Yes/No
```

### 3. Wait for Confirmation
**Do not proceed to next task until human confirms.**

---

## 🚨 Error Recovery

### If Tests Fail
1. Read the specific assertion that failed
2. Determine if test bug or implementation bug
3. Fix and re-run specific test
4. If stuck after 2 attempts → Spawn thinking agent

### If Build Fails
1. Read the full error message
2. Fix the specific issue
3. Re-run build
4. If stuck after 2 attempts → Spawn thinking agent

### If Stuck
```bash
npx ts-node scripts/think.ts "I'm stuck on [problem]. 
I've tried [attempt 1] and [attempt 2]. 
The error is [error message]. 
The relevant code is [code snippet]."
```

---

## ✅ Phase 1.5 Completion Checklist

All must be checked before proceeding to Phase 2:

- [ ] Task 1.5.0: Thinking agent utility created
- [ ] Task 1.5.1: Analyze endpoint fully tested
- [ ] Task 1.5.2: Components and hooks fully tested
- [ ] Task 1.5.3: Logging and monitoring implemented
- [ ] Task 1.5.4: Edge cases hardened in API
- [ ] Task 1.5.5: Edge cases hardened in UI
- [ ] Task 1.5.6: Database optimized
- [ ] Task 1.5.7: Documentation updated
- [ ] All tests passing
- [ ] Build succeeds
- [ ] No lint errors
- [ ] Manual QA completed

---

## 🚀 Begin Implementation

**Start with Task 1.5.0: Setup Thinking Agent Utility**

This must be completed first so you can use it for subsequent tasks.

```
@task 1.5.0
<begin>
Check if @anthropic-ai/sdk is installed.
If not, install it.
Create scripts/think.ts with the thinking agent code.
Test it works.
Report completion.
</begin>
```