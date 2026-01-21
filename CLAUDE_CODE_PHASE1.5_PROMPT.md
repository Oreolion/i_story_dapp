# Claude Code Prompt — Phase 1.5 & Phase 2 Implementation

## Context

Phase 1 (Story Metadata Foundation) is complete. Before building new features, we need to harden the foundation and then implement patterns discovery.

**Read these files first:**
- `CLAUDE.md` — Project architecture and conventions
- `PLAN_PHASE1.5_AND_PHASE2.md` — Detailed implementation plan

---

## Phase 1.5: Validation & Hardening (3-5 days)

### Objective
Ensure Phase 1 is production-ready before adding features.

### Implementation Sequence

```
Step 1: Automated Testing Suite
├── Create __tests__/api/analyze.test.ts
├── Create __tests__/components/StoryInsights.test.ts
├── Run: npx vitest run
└── Checkpoint: All tests pass

Step 2: Error Monitoring
├── Create app/utils/analysisLogger.ts
├── Update analyze endpoint with logging
├── Verify logs appear in console
└── Checkpoint: Errors logged with context

Step 3: Performance Monitoring
├── Create app/utils/performanceMonitor.ts
├── Create app/api/admin/analysis-stats/route.ts
├── Test stats endpoint
└── Checkpoint: Can monitor success rate

Step 4: Edge Case Handling
├── Add retry logic to analysis
├── Handle long content (truncation)
├── Handle failed analysis in UI
└── Checkpoint: Edge cases handled gracefully

Step 5: Database Optimization
├── Verify indexes exist
├── Test RLS policy performance
├── Add any missing indexes
└── Checkpoint: Queries perform well

Step 6: Documentation
├── Update CLAUDE.md with Phase 1 completion
├── Document any deviations
└── Checkpoint: Docs reflect reality
```

### Testing Requirements

After each step:
1. `npm run build` — must pass
2. `npm run lint` — must pass
3. `npx vitest run` — all tests pass
4. Manual verification

---

## Phase 2: Patterns & Discovery (2-3 weeks)

### Objective
Enable users to see patterns across their stories.

### Implementation Sequence

```
Step 1: Patterns Data Layer
├── Create app/hooks/usePatterns.ts
├── Test hook returns correct data
├── Verify computed properties (themeGroups, domainGroups)
└── Checkpoint: Hook works correctly

Step 2: Themes View
├── Create components/patterns/ThemesView.tsx
├── Implement expandable theme cards
├── Add theme color coding
├── Test rendering
└── Checkpoint: Themes display correctly

Step 3: Domains View
├── Create components/patterns/DomainsView.tsx
├── Implement domain distribution chart
├── Add domain icons and colors
├── Test rendering
└── Checkpoint: Domains display correctly

Step 4: Canonical Story Feature
├── Create components/CanonicalBadge.tsx
├── Add to story detail page
├── Test toggle functionality
├── Verify database persistence
└── Checkpoint: Canonical marking works

Step 5: Monthly Summary
├── Create components/patterns/MonthlySummary.tsx
├── Compute monthly stats in usePatterns
├── Test with various data states
└── Checkpoint: Summary displays correctly

Step 6: Library Page Refactor
├── Update app/library/page.tsx with tabs
├── Integrate all pattern components
├── Test tab navigation
├── Test loading states
└── Checkpoint: All tabs working

Step 7: Navigation Update
├── Update components/Navigation.tsx
├── Rename: Library → Archive, Social → Community
├── Verify links work
└── Checkpoint: Navigation reflects hierarchy
```

---

## Extended Thinking Guidelines

Before implementing each component, think through:

1. **Data flow**: Where does data come from? How is it transformed?
2. **State management**: What state is needed? Local vs. hook vs. context?
3. **Error states**: What can go wrong? How do we handle it?
4. **Loading states**: What do users see while data loads?
5. **Edge cases**: Empty data? Too much data? Invalid data?
6. **Accessibility**: Keyboard navigation? Screen readers?
7. **Performance**: Any expensive computations? Memoization needed?

---

## Code Quality Standards

### Hooks
```typescript
// Pattern to follow
export function usePatterns(userWallet: string | null) {
  // 1. State declarations
  const [data, setData] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 2. Fetch function (useCallback)
  const fetchData = useCallback(async () => {
    // Implementation
  }, [dependencies]);

  // 3. Effects
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 4. Computed values (useMemo)
  const computed = useMemo(() => {
    // Expensive computation
  }, [data]);

  // 5. Return
  return { data, isLoading, error, refetch: fetchData, computed };
}
```

### Components
```typescript
// Pattern to follow
interface Props {
  data: DataType;
  isLoading?: boolean;
  onAction?: () => void;
}

export function Component({ data, isLoading, onAction }: Props) {
  // 1. Loading state
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // 2. Empty state
  if (!data || data.length === 0) {
    return <EmptyState />;
  }

  // 3. Main render
  return (
    <div>
      {/* Content */}
    </div>
  );
}
```

---

## Test-Driven Feedback Loop

```
Think → Plan → Implement
         ↓
    Run Tests
         ↓
    Pass? ──No──→ Debug → (loop)
         │
        Yes
         ↓
    Build Check
         ↓
    Pass? ──No──→ Fix → (loop)
         │
        Yes
         ↓
   Manual Verify
         ↓
   Works? ──No──→ Debug → (loop)
         │
        Yes
         ↓
   Next Step
```

---

## Verification Checklist

### Phase 1.5 Complete When:
- [ ] Unit tests exist and pass
- [ ] Error logging implemented
- [ ] Performance monitoring available
- [ ] Edge cases handled
- [ ] Database optimized
- [ ] Documentation updated

### Phase 2 Complete When:
- [ ] `usePatterns` hook working
- [ ] Themes view displays correctly
- [ ] Domains view displays correctly
- [ ] Canonical badge toggles
- [ ] Monthly summary shows data
- [ ] Library page tabs all work
- [ ] Navigation updated
- [ ] All tests pass
- [ ] Performance acceptable

---

## Start Implementation

Begin with **Phase 1.5, Step 1**: Create the test suite.

Create `__tests__/api/analyze.test.ts` following the pattern in PLAN_PHASE1.5_AND_PHASE2.md.

Report checkpoint status after each step.