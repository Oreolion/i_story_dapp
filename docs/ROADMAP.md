# Development Roadmap (MVP Evolution)

## Phase 1: Story Metadata Foundation -- COMPLETE

**Goal:** Every story gets automatically analyzed and tagged.

**Tasks:**
- [x] Create `story_metadata` table in Supabase with RLS
- [x] Add `StoryMetadata` types to `app/types/index.ts`
- [x] Build `/api/ai/analyze` endpoint using Gemini Flash
- [x] Integrate analysis trigger into `/api/journal/save` flow
- [x] Display basic insights on story detail page (`app/story/[storyId]/page.tsx`)
- [x] Write backfill script for existing stories
- [x] Add loading states for analysis

**Key files created/modified:**
```
app/api/ai/analyze/route.ts          (created)
app/api/journal/save/route.ts        (modified - triggers analysis)
app/story/[storyId]/page.tsx         (modified - displays insights)
app/types/index.ts                   (modified - StoryMetadata types)
components/StoryInsights.tsx         (created - insights display component)
scripts/backfill-metadata.ts         (created - one-time migration)
```

## Phase 1.5: Validation & Hardening -- COMPLETE

**Goal:** Ensure Phase 1 implementation is robust with comprehensive tests and security.

**Tasks:**
- [x] Task 1.5.0: Setup Claude SDK thinking agent utility (`scripts/think.ts`)
- [x] Task 1.5.1: Create comprehensive test suite for `/api/ai/analyze` endpoint (38 tests, 100% coverage)
- [x] Task 1.5.2: Create test suite for `StoryInsights` component (41 tests)
- [x] Task 1.5.3: Security audit remediation (34 findings, 8 phases)
- [x] Task 1.5.4: Replace mock endpoints with real DB implementations (journal/save, social/like, user/profile)

**Key files created/modified:**
```
scripts/think.ts                           (Claude SDK thinking agent)
__tests__/api/analyze.test.ts              (38 tests for analyze endpoint)
__tests__/components/StoryInsights.test.tsx (41 tests for insights component)
lib/auth.ts                                (shared auth middleware)
lib/crypto.ts                              (timing-safe comparison)
middleware.ts                              (rate limiting)
app/api/auth/nonce/route.ts                (nonce generation)
scripts/verify-deployment.ts               (contract deployment verification)
```

## Phase 1.6: Chainlink CRE Integration -- COMPLETE

**Goal:** Verifiable AI-attested story metrics via Chainlink DON nodes.

**Tasks:**
- [x] Set up CRE CLI project structure (`cre/eStory_workflow/`)
- [x] Build CRE workflow: HTTP trigger → Gemini AI → DON consensus → on-chain write
- [x] Create ReceiverTemplate interfaces (`contracts/interfaces/`)
- [x] Rewrite VerifiedMetrics.sol to extend ReceiverTemplate
- [x] Deploy VerifiedMetrics to Base Sepolia (`0x052B52A4841080a98876275d5f8E6d094c9E086C`)
- [x] Verify contract on Sourcify
- [x] Build trigger API route (`/api/cre/trigger`)
- [x] Build check API route (`/api/cre/check`)
- [x] Build frontend hook (`useVerifiedMetrics`) with polling
- [x] Build display components (`VerifiedBadge`, `VerifiedMetricsCard`)
- [x] Test simulation with --broadcast (end-to-end on-chain write confirmed)
- [x] Update CRE skill templates with correct SDK patterns
- [ ] Pending: CRE workflow deployment (awaiting Chainlink early access approval)

**Key files created/modified:**
```
cre/eStory_workflow/main.ts               (CRE workflow entry point)
cre/eStory_workflow/gemini.ts             (Gemini AI with HTTPClient consensus)
cre/eStory_workflow/httpCallback.ts       (Full handler: parse → analyze → sign → write)
contracts/VerifiedMetrics.sol             (ReceiverTemplate-based receiver)
contracts/interfaces/                      (IERC165, IReceiver, ReceiverTemplate)
app/api/cre/trigger/route.ts              (Trigger verification)
app/api/cre/check/route.ts               (Read results from contract)
app/hooks/useVerifiedMetrics.ts           (Frontend polling hook)
components/VerifiedBadge.tsx              (Verification badge)
components/VerifiedMetricsCard.tsx        (Metrics display)
lib/contracts.ts                          (Updated ABI + address)
scripts/deployVerifiedMetrics.ts          (Deployment script)
skills/cre/                               (CRE skill templates + SKILL.md)
```

## Phase 1.6.1: Privacy-Preserving CRE -- COMPLETE

**Goal:** Rewrite CRE pipeline to protect user privacy. Full metrics visible only to author; blockchain stores only cryptographic proofs.

**Tasks:**
- [x] Create `PrivateVerifiedMetrics.sol` — minimal on-chain struct (tier, threshold, hashes)
- [x] Move old contract to `contracts/legacy/VerifiedMetrics.sol`
- [x] Create deployment script `scripts/deployPrivateVerifiedMetrics.ts`
- [x] Rewrite `gemini.ts` to use `ConfidentialHTTPClient` (encrypted enclave)
- [x] Rewrite `httpCallback.ts` — 8-step flow with privacy fields + confidential callback
- [x] Add `callbackUrl` and `owner` to Config type
- [x] Create `/api/cre/callback` route (DON callback receiver with secret auth)
- [x] Rewrite `/api/cre/check` with author-based response filtering + legacy fallback
- [x] Update `lib/contracts.ts` with new ABI
- [x] Rewrite `useVerifiedMetrics` hook (metrics + proof separation)
- [x] Rewrite `VerifiedMetricsCard` (dual author/public view)
- [x] Update `VerifiedBadge` with quality tier label
- [x] Update `StoryPageClient` and `StoryCard` component props
- [x] Update middleware rate limits for callback endpoint
- [x] Update all documentation
- [ ] Pending: Deploy new contract (requires funded wallet)
- [ ] Pending: Update CRE workflow secrets for Vault DON

**Key files created/modified:**
```
contracts/PrivateVerifiedMetrics.sol          (new — privacy-preserving contract)
contracts/legacy/VerifiedMetrics.sol          (moved — backward compat)
scripts/deployPrivateVerifiedMetrics.ts       (new — deployment script)
cre/iStory_workflow/gemini.ts                (rewritten — ConfidentialHTTPClient)
cre/iStory_workflow/httpCallback.ts          (rewritten — 8-step privacy flow)
cre/iStory_workflow/main.ts                  (modified — Config type)
cre/iStory_workflow/config.staging.json      (modified — callbackUrl, owner)
app/api/cre/callback/route.ts                (new — DON callback receiver)
app/api/cre/check/route.ts                  (rewritten — author-based filtering)
app/hooks/useVerifiedMetrics.ts              (rewritten — metrics + proof)
components/VerifiedMetricsCard.tsx           (rewritten — dual view)
components/VerifiedBadge.tsx                 (modified — tier label)
lib/contracts.ts                             (modified — new ABI)
middleware.ts                                (modified — callback rate limit)
```

## Phase 2: Patterns & Discovery (Next Up)

**Goal:** Users can see patterns across their stories.

**Tasks:**
- [ ] Add "Themes" tab to Library page with story grouping
- [ ] Add "Life Domains" grouping view
- [ ] Implement "Mark as Canonical" button on story detail
- [ ] Create monthly summary component
- [ ] Add visual indicators for canonical stories in lists
- [ ] Update navigation hierarchy (Archive before Social)

**Key files to create/modify:**
```
app/library/page.tsx                 (modify - add tabs)
components/ThemesView.tsx            (new)
components/DomainsView.tsx           (new)
components/CanonicalBadge.tsx        (new)
components/MonthlySummary.tsx        (new)
app/hooks/usePatterns.ts             (new)
```

## Phase 3: AI Reflection

**Goal:** AI generates insights about the user's life patterns.

**Tasks:**
- [ ] Create `weekly_reflections` table
- [ ] Build `/api/ai/reflection` endpoint
- [ ] Display reflection on Profile page
- [ ] Add "Generate Reflection" trigger
- [ ] Weight canonical stories higher in reflection

**Key files to create/modify:**
```
app/api/ai/reflection/route.ts       (new)
app/profile/page.tsx                 (modify - add reflection section)
components/WeeklyReflection.tsx      (new)
app/hooks/useReflection.ts           (new)
```

## Future Phases (Post-MVP)

- Graph-based memory (theme -> story relationships)
- Memory API for external AI agents
- Default to private with public opt-in
- Only canonical stories can be shared publicly
- ERC-8004 agent identity integration (speculative)

## Privacy & Sharing Model (Target State)

| Story Type | Default Visibility | Can Be Shared | Can Be Minted |
|------------|-------------------|---------------|---------------|
| Regular story | Private | Yes (opt-in) | No |
| Canonical story | Private | Yes (opt-in) | Yes |
| Shared story | Public | Already shared | If canonical |

### Navigation Hierarchy (Target State)

```
Primary:   Record -> Archive -> Patterns -> Profile
Secondary: Community Stories (social feed)
```

The social feed should be a discovery mechanism, not the core loop.
