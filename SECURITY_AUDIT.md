# iStory dApp — Security Audit Report

**Date:** January 30, 2026
**Application:** iStory — Web3 AI Voice Journaling dApp
**Stack:** Next.js 15 / React 19 / Supabase / Wagmi / Hardhat / Solidity 0.8.20 / Base Sepolia
**Overall Risk Score:** D+ (significant remediation required before production)

---

## Score Summary

| Category | Score | Notes |
|---|---|---|
| Authentication & Authorization | 3/10 | Most API routes lack auth checks |
| Smart Contract Security | 7/10 | OpenZeppelin used; centralization risk |
| Input Validation | 4/10 | Inconsistent across routes |
| Data Protection & RLS | 6/10 | RLS exists but gaps remain |
| Infrastructure & Config | 4/10 | Missing headers, rate limiting, CSRF |
| Secret Management | 3/10 | Private key in env, weak cron auth |

---

## Critical Findings (11)

### CRIT-1: Missing auth on onboarding endpoint (IDOR)

- **File:** `app/api/auth/onboarding/route.ts:4`
- **Severity:** Critical
- **Description:** POST accepts `userId`, `name`, `username`, `email` with no session or token verification. Any caller can onboard any userId, overwriting profile data.
- **Fix:** Verify the caller's Supabase session matches the `userId` parameter.

### CRIT-2: Missing auth on link-google endpoint (IDOR)

- **File:** `app/api/auth/link-google/route.ts:12`
- **Severity:** Critical
- **Description:** Accepts `existingUserId` and `googleId` without verifying the caller owns either account. Uses admin client to bypass RLS, so an attacker can link any Google account to any existing user.
- **Fix:** Require a valid Supabase session for the Google auth user; verify ownership of both accounts.

### CRIT-3: Missing auth on link-account endpoint

- **File:** `app/api/auth/link-account/route.ts:5`
- **Severity:** Critical
- **Description:** Accepts `userId` with wallet linking data. While it verifies the wallet signature, it does not verify the caller's session matches `userId`, allowing account takeover by linking an attacker's wallet to a victim's account.
- **Fix:** Require a valid session token and verify it matches the `userId`.

### CRIT-4: Missing auth on AI transcribe endpoint

- **File:** `app/api/ai/transcribe/route.ts`
- **Severity:** Critical
- **Description:** No authentication. Anyone can submit audio files for transcription, consuming ElevenLabs API credits.
- **Fix:** Require Bearer token and validate Supabase session.

### CRIT-5: Missing auth on AI enhance endpoint

- **File:** `app/api/ai/enhance/route.ts`
- **Severity:** Critical
- **Description:** No authentication. Anyone can submit text for AI enhancement, consuming Gemini API credits.
- **Fix:** Require Bearer token and validate Supabase session.

### CRIT-6: Missing auth on AI analyze endpoint

- **File:** `app/api/ai/analyze/route.ts`
- **Severity:** Critical
- **Description:** No session validation. Accepts `storyId` and `storyText` from any caller.
- **Fix:** Require Bearer token; verify caller owns the story.

### CRIT-7: Missing auth on journal/save, social/like, ipfs/upload, book/compile

- **Files:** `app/api/journal/save/route.ts`, `app/api/social/like/route.ts`, `app/api/ipfs/upload/route.ts`, `app/api/book/compile/route.ts`
- **Severity:** Critical
- **Description:** Core data-mutation endpoints lack authentication. Any HTTP client can create stories, like content, upload files to IPFS, or compile books.
- **Fix:** Add auth middleware to all mutation endpoints.

### CRIT-8: Private key exposure in cron endpoint

- **File:** `app/api/cron/distribute-rewards/route.ts:29-34`
- **Severity:** Critical
- **Description:** `ADMIN_PRIVATE_KEY` is loaded at runtime and used to sign blockchain transactions. If the cron endpoint is compromised or the env leaks, the admin wallet (with MINTER_ROLE) is fully compromised, enabling unlimited token minting.
- **Fix:** Use a dedicated low-privilege wallet for rewards; implement minting caps in the contract; consider KMS or multi-sig.

### CRIT-9: Signature replay vulnerability in wallet auth

- **File:** `app/api/auth/login/route.ts:78-82`
- **Severity:** Critical
- **Description:** The signed message has no nonce, timestamp, or expiry. A valid signature can be replayed indefinitely to generate new sessions.
- **Fix:** Include a server-generated nonce and timestamp in the message; reject replayed or expired signatures.

### CRIT-10: Hardcoded contract addresses without verification

- **File:** `lib/contracts.ts:4-6`
- **Severity:** Critical
- **Description:** Contract addresses are hardcoded strings with a comment "Replace these with your deployed address." There is no on-chain verification that these addresses point to the expected contracts, risking interaction with wrong or malicious contracts if misconfigured.
- **Fix:** Add deployment verification scripts; validate contract interfaces at startup.

### CRIT-11: Missing RLS on users table for sensitive fields

- **File:** Supabase `users` table
- **Severity:** Critical
- **Description:** Auth endpoints use admin client to bypass RLS. If any RLS policy gaps exist on the `users` table (e.g., `google_id`, `google_email`, `auth_provider` fields), these sensitive fields could be read or written by unauthorized users through the Supabase client.
- **Fix:** Audit RLS policies on `users` table; ensure `google_id`, `google_email`, `wallet_address` columns are protected; minimize admin client usage.

---

## High Findings (8)

### HIGH-1: Weak cron authentication (timing attack)

- **File:** `app/api/cron/distribute-rewards/route.ts:21`
- **Severity:** High
- **Description:** `authHeader !== \`Bearer ${process.env.CRON_SECRET}\`` uses JavaScript string comparison, which is vulnerable to timing attacks. An attacker could brute-force the secret character by character.
- **Fix:** Use `crypto.timingSafeEqual()` for constant-time comparison.

### HIGH-2: Single admin controls all contract roles

- **Files:** `contracts/iStoryToken.sol:18-20`, `contracts/StoryNFT.sol:16-17`, `contracts/StoryProtocol.sol:22-23`
- **Severity:** High
- **Description:** One address holds `DEFAULT_ADMIN_ROLE`, `MINTER_ROLE`, and `PAUSER_ROLE` across all three contracts. Compromise of this key gives full control over token supply, NFT minting, and protocol pausing.
- **Fix:** Use separate addresses per role; implement multi-sig (e.g., Gnosis Safe); add timelocks for critical operations.

### HIGH-3: No minting cap on IStoryToken

- **File:** `contracts/iStoryToken.sol:27-29`
- **Severity:** High
- **Description:** `mint()` has no supply cap. A compromised minter can inflate token supply infinitely.
- **Fix:** Add a `MAX_SUPPLY` constant and check in `mint()`.

### HIGH-4: Front-running risk on tip and paywall transactions

- **Files:** `contracts/StoryProtocol.sol:30-38`, `contracts/StoryProtocol.sol:44-51`
- **Severity:** High
- **Description:** `tipCreator` and `payPaywall` use `safeTransferFrom` without commit-reveal or minimum amount checks, exposing users to front-running on public mempools.
- **Fix:** Consider a commit-reveal pattern or use private transaction pools for sensitive operations.

### HIGH-5: No zero-address check for msg.sender in mintBook

- **File:** `contracts/StoryNFT.sol:32-37`
- **Severity:** High
- **Description:** `mintBook()` is fully public with no restrictions. Any address can mint unlimited NFTs for free, potentially spamming the collection.
- **Fix:** Add minting fees, rate limits, or require MINTER_ROLE.

### HIGH-6: Admin client overuse in auth routes

- **Files:** `app/api/auth/login/route.ts:88`, `app/api/auth/onboarding/route.ts:2`, `app/api/auth/link-google/route.ts:25`
- **Severity:** High
- **Description:** Multiple auth endpoints use `createSupabaseAdminClient()` which bypasses all RLS policies. Any vulnerability in these routes grants unrestricted database access.
- **Fix:** Minimize admin client usage; use scoped service clients where possible; add explicit authorization checks before admin operations.

### HIGH-7: File upload validation missing

- **File:** `app/api/ipfs/upload/route.ts`
- **Severity:** High
- **Description:** No file type whitelist, size limit, or content validation before uploading to IPFS via Pinata.
- **Fix:** Validate MIME type against whitelist; enforce max file size; scan content.

### HIGH-8: OAuth fields stored without column-level RLS

- **File:** Supabase `users` table — `google_id`, `google_email`, `google_avatar` columns
- **Severity:** High
- **Description:** OAuth-related fields are stored in the same `users` table accessible by the client. Without column-level restrictions, any authenticated user could potentially read others' Google emails via Supabase queries.
- **Fix:** Add column-level security or move OAuth data to a separate protected table.

---

## Medium Findings (9)

### MED-1: No rate limiting on most endpoints

- **Files:** All API routes except `app/api/ai/analyze/route.ts`
- **Severity:** Medium
- **Description:** No rate limiting on transcription, enhancement, journal save, IPFS upload, etc. Enables API abuse and cost overruns.
- **Fix:** Implement global rate limiting via middleware (e.g., Upstash Redis).

### MED-2: No CSRF protection

- **Files:** All POST API routes
- **Severity:** Medium
- **Description:** No CSRF tokens on mutation endpoints. While Bearer token auth provides some protection, browser-based requests without tokens are vulnerable.
- **Fix:** Implement CSRF tokens or use SameSite cookie attributes.

### MED-3: Error information disclosure

- **Files:** `app/api/ai/analyze/route.ts`, `app/api/auth/login/route.ts`, `app/api/cron/distribute-rewards/route.ts`
- **Severity:** Medium
- **Description:** Some catch blocks return `error.message` directly to the client, potentially leaking internal details (database errors, API responses, stack traces).
- **Fix:** Log detailed errors server-side; return generic error messages to clients.

### MED-4: No input length validation on AI endpoints

- **Files:** `app/api/ai/enhance/route.ts`, `app/api/ai/transcribe/route.ts`
- **Severity:** Medium
- **Description:** No maximum length on text input or audio file size. Users can submit extremely large payloads to consume AI API credits disproportionately.
- **Fix:** Enforce max character count for text (e.g., 50,000 chars); max file size for audio (e.g., 25MB).

### MED-5: Potential XSS via story content

- **Files:** `app/story/[storyId]/page.tsx`, `components/StoryCard.tsx`
- **Severity:** Medium
- **Description:** If story content is rendered with `dangerouslySetInnerHTML` or without sanitization, malicious content could execute scripts.
- **Fix:** Sanitize all user-generated content before rendering; use DOMPurify or equivalent.

### MED-6: Unvalidated OAuth redirect

- **File:** `app/api/auth/callback/route.ts`
- **Severity:** Medium
- **Description:** OAuth callback should validate the redirect URL to prevent open redirect attacks.
- **Fix:** Whitelist allowed redirect destinations.

### MED-7: Race conditions in like/reward system

- **Files:** `app/api/social/like/route.ts`, `app/api/cron/distribute-rewards/route.ts`
- **Severity:** Medium
- **Description:** Like counting and reward distribution lack database-level locking, enabling double-counting via concurrent requests.
- **Fix:** Use database transactions with row-level locking; add unique constraints on (user_id, story_id) for likes.

### MED-8: Missing security headers

- **File:** `next.config.mjs`
- **Severity:** Medium
- **Description:** No Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, or Referrer-Policy headers configured.
- **Fix:** Add security headers in `next.config.mjs` `headers()` function.

### MED-9: Paginated user search is inefficient and leaks timing info

- **File:** `app/api/auth/login/route.ts:15-43`
- **Severity:** Medium
- **Description:** `findUserInPaginatedList` iterates all auth users page by page. Response time varies with user count, leaking information about total user count. Also scales poorly.
- **Fix:** Query by email directly using `admin.auth.admin.getUserByEmail()` or use database lookup instead of iterating.

---

## Low Findings (6)

### LOW-1: Build-time checks disabled

- **File:** `app/api/cron/distribute-rewards/route.ts:9`
- **Severity:** Low
- **Description:** `export const dynamic = 'force-dynamic'` disables static analysis. While necessary for runtime env access, it also prevents build-time validation.
- **Fix:** Acceptable for this route; document the reason.

### LOW-2: Missing timing-safe comparison utility

- **Severity:** Low
- **Description:** No shared utility for constant-time string comparison exists in the codebase.
- **Fix:** Create a shared `lib/crypto.ts` utility with `timingSafeEqual` wrapper.

### LOW-3: Username enumeration via onboarding

- **File:** `app/api/auth/onboarding/route.ts`
- **Severity:** Low
- **Description:** Username uniqueness check could reveal whether a username exists. Low risk but useful for reconnaissance.
- **Fix:** Use generic error messages that don't distinguish between "username taken" and other failures.

### LOW-4: Missing gas limits on contract calls

- **File:** `app/api/cron/distribute-rewards/route.ts`
- **Severity:** Low
- **Description:** Blockchain transactions from the cron job don't specify gas limits, risking unexpected costs on congested networks.
- **Fix:** Set explicit gas limits on `writeContract` calls.

### LOW-5: .env.local contains all secrets in one file

- **File:** `.env.local`
- **Severity:** Low
- **Description:** Single file contains blockchain private keys, API keys, and database credentials. Compromise of the file exposes everything.
- **Fix:** In production, use Vercel environment variables with scoped access; use hardware wallets or KMS for private keys.

### LOW-6: No Content-Security-Policy

- **File:** `next.config.mjs`
- **Severity:** Low
- **Description:** Missing CSP header allows loading resources from any origin.
- **Fix:** Define strict CSP allowing only required origins.

---

## What's Working Well

1. **OpenZeppelin contracts** — All three Solidity contracts use audited OpenZeppelin libraries (ReentrancyGuard, SafeERC20, Pausable, AccessControl, ERC2981).
2. **Wallet signature verification** — `app/api/auth/login/route.ts` properly verifies wallet signatures via Viem's `verifyMessage`.
3. **RLS policies exist** — Supabase Row Level Security is configured via migration files.
4. **Secrets not in source code** — All credentials are in `.env.local` (gitignored), not hardcoded in source.
5. **Input validation on analyze endpoint** — `app/api/ai/analyze/route.ts` has comprehensive request validation.
6. **Signature format validation** — Login and link-account routes validate hex format of signatures before processing.
7. **SafeERC20 usage** — `StoryProtocol.sol` uses `SafeERC20` to prevent silent transfer failures.

---

## Recommended Actions

### Priority 1 — Before any public deployment

| # | Action | Findings Addressed |
|---|---|---|
| 1 | Add auth middleware to all API routes | CRIT-1 through CRIT-7 |
| 2 | Add nonce + expiry to wallet signature messages | CRIT-9 |
| 3 | Move private key to KMS or multi-sig; add minting cap | CRIT-8, HIGH-2, HIGH-3 |
| 4 | Restrict `mintBook()` with fee or role check | HIGH-5 |
| 5 | Add rate limiting (Upstash or similar) | MED-1 |
| 6 | Add input validation (length, file type, file size) | MED-4, HIGH-7 |

### Priority 2 — Before mainnet launch

| # | Action | Findings Addressed |
|---|---|---|
| 7 | Use timing-safe comparison for cron secret | HIGH-1 |
| 8 | Minimize admin client usage in auth routes | HIGH-6 |
| 9 | Audit and harden RLS policies on users table | CRIT-11, HIGH-8 |
| 10 | Add security headers (CSP, X-Frame-Options, etc.) | MED-8, LOW-6 |
| 11 | Sanitize rendered user content | MED-5 |
| 12 | Validate OAuth redirect URLs | MED-6 |

### Priority 3 — Ongoing hardening

| # | Action | Findings Addressed |
|---|---|---|
| 13 | Add CSRF protection | MED-2 |
| 14 | Genericize error messages | MED-3 |
| 15 | Add database locking for likes/rewards | MED-7 |
| 16 | Replace paginated user search with direct query | MED-9 |
| 17 | Set gas limits on cron transactions | LOW-4 |
| 18 | Consider professional penetration testing | All |

---

## Files Affected

| File | Findings |
|---|---|
| `app/api/auth/onboarding/route.ts` | CRIT-1, LOW-3 |
| `app/api/auth/link-google/route.ts` | CRIT-2, HIGH-6 |
| `app/api/auth/link-account/route.ts` | CRIT-3 |
| `app/api/auth/login/route.ts` | CRIT-9, HIGH-6, MED-9 |
| `app/api/auth/callback/route.ts` | MED-6 |
| `app/api/ai/transcribe/route.ts` | CRIT-4, MED-4 |
| `app/api/ai/enhance/route.ts` | CRIT-5, MED-4 |
| `app/api/ai/analyze/route.ts` | CRIT-6, MED-3 |
| `app/api/journal/save/route.ts` | CRIT-7 |
| `app/api/social/like/route.ts` | CRIT-7, MED-7 |
| `app/api/ipfs/upload/route.ts` | CRIT-7, HIGH-7 |
| `app/api/book/compile/route.ts` | CRIT-7 |
| `app/api/cron/distribute-rewards/route.ts` | CRIT-8, HIGH-1, MED-7, LOW-1, LOW-4 |
| `lib/contracts.ts` | CRIT-10 |
| `contracts/iStoryToken.sol` | HIGH-2, HIGH-3 |
| `contracts/StoryProtocol.sol` | HIGH-2, HIGH-4 |
| `contracts/StoryNFT.sol` | HIGH-2, HIGH-5 |
| `app/utils/supabase/supabaseAdmin.ts` | HIGH-6 |
| `next.config.mjs` | MED-8, LOW-6 |
| Supabase `users` table (RLS policies) | CRIT-11, HIGH-8 |
| All POST API routes | MED-1, MED-2, MED-3 |

---

**Total findings: 34** — 11 Critical, 8 High, 9 Medium, 6 Low

*Report generated by automated security analysis agents. Manual verification recommended for all critical findings.*
