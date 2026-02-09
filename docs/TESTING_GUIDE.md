# Testing Guide

## Unit Tests (Vitest)

Setup file at `__tests__/setup.ts` mocks:
- `wagmi` hooks (useAccount, useBalance, useConnect, etc.)
- `next/navigation` (useRouter, useParams, usePathname)
- `ResizeObserver` for Radix/shadcn components
- Supabase client

### Test Files

| File | Coverage | Description |
|------|----------|-------------|
| `__tests__/api/analyze.test.ts` | 100% lines | `/api/ai/analyze` endpoint (38 tests) |
| `__tests__/components/StoryInsights.test.tsx` | Full | StoryInsights component (41 tests) |
| `__tests__/RecordPage.test.tsx` | Partial | Recording page tests |

**Total: 96 tests passing (3 test files)**

```bash
npx vitest run                                    # Run all tests
npx vitest run __tests__/api/analyze.test.ts     # Analyze endpoint tests
npx vitest run __tests__/components/             # All component tests
npx vitest --coverage                            # Run with coverage report
```

## E2E Tests (Playwright)

- Auto-starts dev server on port 3001 (avoids conflicts)
- Config in `playwright.config.ts`
- Browsers: Chrome, Firefox, Safari

```bash
npx playwright test --ui  # Interactive mode
```

## Mocking Patterns

### Gemini AI Mock (using vi.hoisted for class constructors)

```typescript
const { mockGenerateContent, MockGoogleGenerativeAI } = vi.hoisted(() => {
  const mockGenerateContent = vi.fn();
  class MockGoogleGenerativeAI {
    constructor(_apiKey: string) {}
    getGenerativeModel() {
      return { generateContent: mockGenerateContent };
    }
  }
  return { mockGenerateContent, MockGoogleGenerativeAI };
});

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: MockGoogleGenerativeAI,
}));

const mockAnalysisResponse = {
  themes: ["growth", "reflection"],
  emotional_tone: "hopeful",
  life_domain: "identity",
  intensity_score: 0.7,
  significance_score: 0.8,
  people_mentioned: ["Mom"],
  places_mentioned: ["Chicago"],
  time_references: ["last summer"],
  brief_insight: "A story about finding clarity through change."
};
```

### Auth Mock (required for all protected route tests)

```typescript
const { MOCK_USER_ID } = vi.hoisted(() => ({
  MOCK_USER_ID: "test-user-123",
}));

vi.mock("@/lib/auth", () => ({
  validateAuthOrReject: vi.fn().mockResolvedValue(MOCK_USER_ID),
  isAuthError: vi.fn().mockReturnValue(false),
}));

// If route does ownership checks, mock Supabase from() for multiple tables:
mockSupabaseFrom.mockImplementation((table: string) => {
  if (table === "stories") return { select: mockOwnershipSelect };
  return { upsert: mockSupabaseUpsert };
});
```

### Framer Motion Mock (for component tests)

```typescript
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<object>) => (
      <div {...props}>{children}</div>
    ),
  },
}));
```

## AI Analysis Prompt Template

```typescript
const ANALYSIS_PROMPT = `Analyze this personal story and extract structured metadata.
Respond ONLY with valid JSON, no markdown.

Story:
"""
{STORY_TEXT}
"""

Return this exact JSON structure:
{
  "themes": ["theme1", "theme2"],
  "emotional_tone": "string",
  "life_domain": "string",
  "intensity_score": 0.0,
  "significance_score": 0.0,
  "people_mentioned": ["name1"],
  "places_mentioned": ["place1"],
  "time_references": ["reference1"],
  "brief_insight": "string"
}`;
```
