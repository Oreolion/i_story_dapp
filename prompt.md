# Claude Code Implementation Prompt — Phase 1: Story Metadata Foundation

## Context

You are implementing Phase 1 of the iStory cognitive layer. Read these files first:
- `CLAUDE.md` — Project architecture, conventions, and roadmap
- `PLAN.md` — Detailed implementation plan with code samples

## Objective

Implement automatic story analysis that extracts structured metadata (themes, emotions, life domains, significance scores) from every story saved in iStory.

---

## Implementation Instructions

### Use Extended Thinking

Before writing any code, think through:
1. What dependencies exist between components?
2. What could fail and how should we handle it?
3. Are there any architectural decisions that could affect future phases?

### Follow This Sequence

```
Step 1: Database Setup
├── Read PLAN.md Step 1 carefully
├── Use Supabase MCP to run the SQL
├── Verify table exists with test query
└── Checkpoint: Confirm schema matches spec

Step 2: Type Definitions  
├── Create app/types/metadata.ts
├── Export from app/types/index.ts
├── Run `npm run build` to verify types compile
└── Checkpoint: No TypeScript errors

Step 3: Analysis API Endpoint
├── Create app/api/ai/analyze/route.ts
├── Implement POST handler with Gemini integration
├── Implement GET handler for status checks
├── Test with curl or Postman
└── Checkpoint: API returns valid JSON

Step 4: Integration with Save Flow
├── Locate app/api/journal/save/route.ts
├── Add analysis trigger (fire-and-forget pattern)
├── Test by creating a new story
└── Checkpoint: New stories get metadata records

Step 5: UI Components
├── Create components/StoryInsights.tsx
├── Create app/hooks/useStoryMetadata.ts
├── Test component rendering in isolation
└── Checkpoint: Component displays correctly

Step 6: Story Page Integration
├── Update app/story/[storyId]/page.tsx
├── Add insights section below story content
├── Test with existing and new stories
└── Checkpoint: Insights visible on story pages

Step 7: Backfill & Testing
├── Create scripts/backfill-metadata.ts
├── Run backfill for existing stories
├── Create unit tests in __tests__/
├── Perform manual testing
└── Checkpoint: All tests pass
```

---

## Testing Requirements

### After Each Step

1. **Build check:** `npm run build` — must pass
2. **Lint check:** `npm run lint` — must pass  
3. **Type check:** Verify no TypeScript errors
4. **Runtime test:** Verify feature works manually

### Test-Driven Feedback Loop

```
Write/Modify Code
      ↓
Run Build + Lint
      ↓
    Pass? ──No──→ Fix Issues ──→ (loop back)
      │
     Yes
      ↓
Manual Test Feature
      ↓
   Works? ──No──→ Debug + Fix ──→ (loop back)
      │
     Yes
      ↓
Move to Next Step
```

---

## Code Quality Standards

### API Endpoints
- Always validate input parameters
- Return consistent response shapes: `{ success: true, data }` or `{ success: false, error }`
- Log errors with context (story ID, operation, etc.)
- Handle edge cases (empty content, very long content)

### Components
- Use TypeScript strict mode
- Follow existing component patterns in the codebase
- Include loading and error states
- Use shadcn/ui components from `components/ui/`

### Database Operations
- Use appropriate Supabase client (server vs browser)
- Handle errors gracefully
- Use upsert with conflict handling where appropriate

---

## Commands Reference

```bash
# Development
npm run dev              # Start dev server

# Testing
npm run build            # Verify build passes
npm run lint             # Check linting
npx vitest run           # Run unit tests

# Database (via Supabase MCP)
# Use mcp__supabase to run SQL directly
```

---

## Error Handling Patterns

### API Errors
```typescript
try {
  // operation
} catch (error) {
  console.error(`[analyze] Failed for story ${storyId}:`, error);
  return NextResponse.json(
    { success: false, error: "Human readable message" },
    { status: 500 }
  );
}
```

### Graceful Degradation
- If analysis fails, story save should still succeed
- If metadata fetch fails, story page should still render
- Always show loading states during async operations

---

## Verification Checklist

Before marking Phase 1 complete:

- [ ] `story_metadata` table exists with correct schema
- [ ] RLS policies applied and working
- [ ] Types defined and exported correctly
- [ ] `/api/ai/analyze` POST endpoint works
- [ ] `/api/ai/analyze` GET endpoint works
- [ ] Journal save triggers analysis
- [ ] `StoryInsights` component renders metadata
- [ ] `useStoryMetadata` hook fetches correctly
- [ ] Story detail page shows insights
- [ ] Backfill script runs without errors
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] Manual testing passes all scenarios

---

## Start Implementation

Begin with Step 1: Database Setup.

Use the Supabase MCP to execute the SQL from PLAN.md.
After table creation, verify with:
```sql
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'story_metadata';
```

Report back with confirmation before proceeding to Step 2.