# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
Detailed references are in `docs/` — read them on-demand when needed.

| Doc | Contents |
|-----|----------|
| `docs/API_REFERENCE.md` | All API routes, methods, auth requirements |
| `docs/DATABASE_SCHEMA.md` | Tables, SQL schemas, type definitions |
| `docs/TESTING_GUIDE.md` | Test setup, mocking patterns, coverage |
| `docs/ROADMAP.md` | Phase 1-3 tasks, privacy model, nav hierarchy |
| `docs/WORKFLOWS.md` | Prompt templates, headless mode, autonomous workflows |
| `docs/DECISIONS.md` | Architecture decision log, references |

---

## Project Overview

**iStory** is a Web3 AI-powered voice journaling dApp that transforms personal narratives into structured, sovereign memory infrastructure. Built on Base (Ethereum L2), it combines voice capture, AI transcription, blockchain permanence, and cognitive analysis.

### Tech Stack

- **Frontend:** Next.js 15.5.9, React 19, Tailwind CSS 4, shadcn/ui
- **Web3:** Wagmi 2.17, Viem 2.38, RainbowKit 2.2, Hardhat
- **Backend:** Supabase (PostgreSQL + Auth + Storage), Pinata (IPFS)
- **AI:** ElevenLabs Scribe (speech-to-text), Google Gemini 2.5 Flash (text enhancement + analysis), Claude SDK (thinking agent)
- **Testing:** Vitest (unit tests), Playwright (E2E tests)
- **Email:** Resend
- **Blockchain:** Base Sepolia (chain ID: 84532)

### Current Phase

Phase 1.5 Complete (Security Hardening) — Ready for Phase 2 (Patterns & Discovery). See `docs/ROADMAP.md` for details.

---

## Workflow Preferences

Before starting complex debugging or multi-step implementations, ask if there's a time constraint or if the user wants a checkpoint approach with testing between phases.

---

## Development Commands

All commands run from the `i_story_dapp/` directory:

```bash
# Development
npm run dev              # Start dev server on localhost:3000
npm run build            # Production build
npm run lint             # Run ESLint

# Unit Tests (Vitest)
npx vitest run           # Run once without watch
npx vitest run __tests__/RecordPage.test.tsx  # Single test file

# E2E Tests (Playwright)
npx playwright test                    # Run all e2e tests (server on port 3001)
npx playwright test --ui               # Interactive UI mode

# Smart Contracts (Hardhat)
npx hardhat compile
npx hardhat run scripts/deploy.ts --network baseSepolia
npx hardhat run scripts/verify-deployment.ts --network baseSepolia
```

---

## Directory Structure

```
i_story_dapp/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes (all require Bearer token auth)
│   │   ├── admin/, ai/, auth/, book/, books/, cron/, email/
│   │   ├── habits/, ipfs/, journal/, notifications/
│   │   ├── paywall/, social/, stories/, sync/, tip/, user/
│   ├── hooks/                    # React hooks
│   ├── types/                    # TypeScript definitions
│   ├── utils/                    # Utilities (Supabase clients, services)
│   └── [pages]/                  # books, library, profile, record, social, story, tracker
├── components/                   # React components (ui/, emails/, Provider, AuthProvider, Nav)
├── contracts/                    # Solidity smart contracts
├── lib/                          # Shared libraries (auth, crypto, contracts, wagmi, viem)
├── scripts/                      # Hardhat deployment & utility scripts
├── middleware.ts                 # API rate limiting
├── __tests__/                    # Unit tests (Vitest)
├── e2e/                          # E2E tests (Playwright)
└── docs/                         # Detailed reference docs
```

---

## Security Architecture

All API routes are protected by a layered security model:

```
Layer 4: Ownership Verification — User can only modify their own resources
Layer 3: Input Validation — File size, MIME type, text length limits
Layer 2: Bearer Token Auth — validateAuthOrReject() via lib/auth.ts
Layer 1: Rate Limiting — middleware.ts (AI=10/min, Auth=20/min)
Layer 0: Security Headers — CSP, X-Frame-Options, CORS via next.config
```

**Key Security Files:**
| File | Purpose |
|------|---------|
| `lib/auth.ts` | `validateAuth`, `validateAuthOrReject`, `validateWalletOwnership`, `isAuthError` |
| `lib/crypto.ts` | Timing-safe string comparison (`safeCompare`) |
| `middleware.ts` | Rate limiting with route-specific limits |
| `app/api/auth/nonce/route.ts` | Nonce generation for wallet signature replay prevention |
| `next.config.mjs` | Security headers (CSP, X-Frame-Options DENY, nosniff) |

**Adding auth to a new API route:**
```typescript
import { validateAuthOrReject, isAuthError } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const authResult = await validateAuthOrReject(req);
  if (isAuthError(authResult)) return authResult;
  const authenticatedUserId = authResult;
  // ... route logic
}
```

**Error response pattern (never leak internals):**
```typescript
console.error("[ROUTE_NAME] Error:", err);
return NextResponse.json({ error: "Internal server error" }, { status: 500 });
```

---

## Authentication

### Wallet Flow
1. User connects wallet via RainbowKit
2. Client fetches nonce: `GET /api/auth/nonce?address=0x...`
3. User signs nonce message (includes UUID nonce + timestamp)
4. Client sends signature to `POST /api/auth/login`
5. Server verifies nonce (one-time use, 5-min expiry) and signature
6. AuthProvider stores Supabase JWT in localStorage
7. All API routes verify JWT via `lib/auth.ts`

### Google OAuth Flow
1. User clicks "Sign in with Google" → Google OAuth redirect
2. Redirected to `/api/auth/callback` (validates URL against whitelist)
3. Supabase handles session, AuthProvider picks up token

### Implementation Guidelines
- **All new API routes MUST** use `validateAuthOrReject` from `lib/auth.ts`
- **Ownership checks:** Verify user owns the resource before mutations
- **Error responses:** Never return `error.message` — use generic messages
- Always consider race conditions between OAuth and wallet auth providers

---

## Architecture

### Provider Stack (components/Provider.tsx)
WagmiProvider → QueryClientProvider → RainbowKitProvider → ThemeProvider → AuthProvider → AppContext

### Smart Contracts (Base Sepolia)

| Contract | Purpose | Key Features |
|----------|---------|--------------|
| **iStoryToken** | ERC20 $STORY token | MAX_SUPPLY 100M, Pausable, AccessControl |
| **StoryProtocol** | Tips & paywall | Pausable |
| **StoryNFT** | ERC721 story books | mintFee 0.001 ETH, ERC2981 royalties |

- Addresses in `lib/contracts.ts`, ABIs in `lib/abis/`
- Verify: `npx hardhat run scripts/verify-deployment.ts --network baseSepolia`

### Supabase Client Variants (`app/utils/supabase/`)

| File | Use Case |
|------|----------|
| `supabaseClient.ts` | Browser/client components (singleton, SSR-safe) |
| `supabaseServer.ts` | API routes, SSR (uses cookies) |
| `supabaseAdmin.ts` | Admin operations (bypasses RLS) |

---

## Key Patterns & Conventions

- **Path alias:** `@/*` maps to project root
- **UI:** shadcn/ui in `components/ui/`, Tailwind CSS 4 dark mode via `class`
- **Forms:** react-hook-form + zod validation
- **Toasts:** sonner + react-hot-toast
- **Animations:** framer-motion

### Naming Conventions
| Concept | Internal Name | User-Facing Name |
|---------|--------------|------------------|
| Important story | `is_canonical` | "Important" / "Key Moment" |
| Story with metadata | `NarrativeObject` | "Story" |
| Metadata extraction | `analyzeStory()` | "Insights" |
| Weekly summary | `WeeklyReflection` | "Weekly Reflection" |

### API Response Patterns
```typescript
// Success: { success: true, data: {...} }
// Error:   { error: "Human-readable message", code?: "ERROR_CODE" }
// Analysis: { success: true, metadata: {...}, insight: "..." }
```

---

## Common Tasks

### Add a new API route
1. Create folder in `app/api/[route-name]/`
2. Add `route.ts` with `validateAuthOrReject` from `lib/auth.ts`
3. Add ownership verification where applicable
4. Use generic error messages (never `error.message`)

### Add a new page
1. Create folder in `app/[page-name]/`, add `page.tsx`
2. Update `Navigation.tsx` if needed

### Add a new Web3 hook
1. Create in `app/hooks/`, import ABI from `lib/contracts.ts`
2. Use Wagmi hooks (useReadContract, useWriteContract)

### Update contracts after deployment
1. Deploy: `npx hardhat run scripts/deploy.ts --network baseSepolia`
2. Update `lib/contracts.ts` and `.env.local`

---

## Environment Variables

Create `.env.local` from `.env.example`. Key groups: Supabase, WalletConnect, AI Services (Gemini, ElevenLabs, Anthropic), IPFS/Pinata, Contract Addresses (Base Sepolia), Hardhat (private key, Basescan), Resend, CRON_SECRET.

---

## Configuration Files

| File | Purpose |
|------|---------|
| `next.config.mjs` | Next.js config + security headers |
| `middleware.ts` | API rate limiting |
| `hardhat.config.ts` | Solidity config |
| `vitest.config.ts` | Unit test config |
| `playwright.config.ts` | E2E test config |
| `tailwind.config.ts` | Tailwind CSS config |

---

## Hooks Reference

**Web3:** `useIStoryToken` (balance, approve), `useStoryProtocol` (tipCreator, payPaywall), `useStoryNFT` (mintBook)
**Supabase:** `useBrowserSupabase` (client singleton), `useNotifications` (CRUD + real-time polling)
**Planned:** `useStoryMetadata`, `usePatterns` — see `docs/ROADMAP.md`
