# Chainlink CRE Integration in eStory

## What Problem Does It Solve?

eStory uses AI (Google Gemini) to analyze stories and produce quality metrics — significance score, emotional depth, writing quality, and themes. But if the AI analysis runs on your server, **anyone can fake the results**. A user could claim their story scored 95/100 when it actually scored 40. There's no way to prove the metrics are legitimate.

Chainlink CRE (Compute Runtime Environment) solves this by making the AI analysis **verifiable and tamper-proof**.

| Without Chainlink | With Chainlink CRE |
|---|---|
| AI runs on your server — you could fake results | AI runs on multiple independent DON nodes with consensus |
| Metrics stored in your database — you could edit them | Metrics stored on-chain — immutable, publicly auditable |
| Users must trust you | Users can verify on-chain themselves |
| "Trust me, the AI said 95/100" | "Here's the on-chain proof, verified by Chainlink's DON" |

The key insight: **Chainlink doesn't replace your AI — it makes your AI trustworthy** by running it in a decentralized, consensus-based environment and recording the results immutably on-chain.

---

## What Triggers Verification?

**It is triggered automatically when a user saves a journal entry.** There is no "Verify" button the user clicks.

In `app/api/journal/save/route.ts` (around line 81-97), after the story is successfully saved to Supabase, the API fires off a background request:

```typescript
// Trigger CRE verification in the background (fire and forget)
fetch(`${appUrl}/api/cre/trigger`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: authHeader,
  },
  body: JSON.stringify({ storyId: story.id }),
}).catch(err => console.error("[JOURNAL/SAVE] CRE trigger failed:", err));
```

This is a **fire-and-forget** call — meaning:
- The save response returns immediately to the user (they don't wait for verification)
- The CRE workflow runs asynchronously in the background
- If it fails, the error is logged but the save still succeeds
- The comment in code says: *"Non-critical: verification can be triggered manually later"*

The `useVerifiedMetrics` hook on the story page then **polls every 10 seconds** until the on-chain result appears, at which point it displays the verified metrics.

---

## The Full Pipeline

```
User records/writes a story and hits Save
       |
       v
  /api/journal/save
       |  1. Saves story to Supabase
       |  2. Triggers AI analysis (Gemini, for local insights)
       |  3. Triggers CRE verification (fire-and-forget)
       v
  /api/cre/trigger
       |  Validates ownership, creates verification_logs entry
       |  POSTs story content to Chainlink CRE workflow URL
       v
  Chainlink DON (Decentralized Oracle Network)
       |  Multiple independent nodes ALL run the same Gemini call
       |  They must ALL agree on the result (consensus)
       v
  KeystoneForwarder (0x82300bd7...)
       |  Verifies DON signatures, forwards the signed report
       v
  VerifiedMetrics.sol (smart contract on Base Sepolia)
       |  Decodes report, validates score ranges, stores permanently
       |  Emits MetricsVerified event
       v
  useVerifiedMetrics hook (polls every 10s)
       |  Calls /api/cre/check → reads contract → caches to Supabase
       v
  Story page shows verified metrics with on-chain proof
```

---

## Each Piece Explained

### 1. The Trigger (`/api/cre/trigger`)

**File:** `app/api/cre/trigger/route.ts`

When called (automatically from journal save, or manually):
- Validates the user owns the story (Bearer token auth)
- Checks it hasn't already been verified (prevents duplicates — 409 if exists)
- Creates a `verification_logs` entry with status `"pending"`
- POSTs story content (id, title, content, author wallet) to `CRE_WORKFLOW_URL`

**Error cases:**
- 400: Missing storyId, story not found, empty content, no author wallet
- 403: User does not own the story
- 409: Already verified or verification in progress

### 2. The CRE Workflow (runs on Chainlink DON nodes)

**Files:** `cre/iStory_workflow/`

Three files define the workflow:

#### `main.ts` — Entry Point
- Sets up an HTTP trigger using `@chainlink/cre-sdk`
- Reads config from `config.staging.json` (chain details, contract address, gas limit)
- Routes incoming POST requests to the handler

#### `gemini.ts` — AI Analysis
- Calls Google Gemini API to analyze the story
- The critical difference from a normal API call: **every DON node independently makes the same Gemini call**
- Uses `consensusIdenticalAggregation` — all nodes must return the exact same result
- If even one node gets a different answer, the workflow fails (prevents tampering)

**Analysis prompt asks Gemini to return:**
```json
{
  "significanceScore": 0-100,
  "emotionalDepth": 1-5,
  "qualityScore": 0-100,
  "wordCount": 450,
  "themes": ["growth", "resilience"]
}
```

#### `httpCallback.ts` — Orchestrator (7 steps)
1. **Parse & validate** — Decode JSON payload, check required fields
2. **AI analysis** — Call `askGemini()` with DON consensus
3. **Network setup** — Get chain config, create EVMClient for Base Sepolia
4. **Encode data** — Convert metrics to ABI-encoded bytes (storyId → bytes32, scores → uint8, etc.)
5. **Generate CRE report** — Call `runtime.report()` with `signingAlgo: "ecdsa"`, `hashingAlgo: "keccak256"`
6. **Write on-chain** — Call `evmClient.writeReport()` to KeystoneForwarder → VerifiedMetrics contract
7. **Return result** — Success returns transaction hash

### 3. The Smart Contract (`VerifiedMetrics.sol`)

**File:** `contracts/VerifiedMetrics.sol`

Inherits from Chainlink's `ReceiverTemplate`, which enforces:
- **Only the KeystoneForwarder** can call `onReport()` — no one else can write fake metrics
- Optional workflow identity verification (workflow ID, author address)

When a signed report arrives via `onReport()`:
1. `ReceiverTemplate` validates `msg.sender == forwarderAddress`
2. `_processReport()` decodes the ABI-encoded bytes into storyId, author, scores, themes
3. Validates ranges: significance 0-100, emotional depth 1-5, quality 0-100
4. Stores in `mapping(bytes32 storyId => Metrics)` — permanent, immutable
5. Emits `MetricsVerified` event

**Stored metrics struct:**
```solidity
struct Metrics {
    uint8 significanceScore;   // 0-100
    uint8 emotionalDepth;      // 1-5
    uint8 qualityScore;        // 0-100
    uint32 wordCount;
    string[] themes;
    bytes32 attestationId;     // CRE report ID
    uint256 verifiedAt;        // block timestamp
    bool exists;
}
```

**Read functions (public, anyone can call):**
- `getMetrics(bytes32 storyId)` — full metrics
- `isVerified(bytes32 storyId)` — boolean check
- `getAttestationId(bytes32 storyId)` — CRE report ID

### 4. Reading Results (`/api/cre/check` + `useVerifiedMetrics`)

**File:** `app/api/cre/check/route.ts`

Called by the frontend hook to read on-chain results:
1. Converts story UUID to bytes32 (remove dashes, pad to 64 hex)
2. Calls `isVerified(storyId)` on the contract via Base Sepolia RPC
3. If verified, reads `getMetrics(storyId)` for full data
4. Caches result to `verified_metrics` table in Supabase
5. Updates `verification_logs` status to `"completed"`

**File:** `app/hooks/useVerifiedMetrics.ts`

React hook that polls for results:
1. **Check Supabase cache first** (fast) — if found, done
2. **Check if pending** — query `verification_logs` for `status = "pending"`
3. **Poll on-chain** — call `/api/cre/check` every 10 seconds until verified

```typescript
const { metrics, isPending, isVerified, error, refetch } = useVerifiedMetrics(storyId);
```

---

## Security Layers

1. **API Auth:** All endpoints require Bearer token via `validateAuthOrReject`
2. **Ownership:** `/api/cre/trigger` verifies user owns the story before triggering
3. **DON Consensus:** Multiple independent nodes must agree on the Gemini result
4. **Forwarder Validation:** `ReceiverTemplate` checks `msg.sender == forwarderAddress`
5. **Workflow Identity:** Optional verification of workflow ID/author address
6. **On-chain Immutability:** Once written, metrics cannot be modified or deleted

---

## Practical Example

A user writes a story about overcoming a challenge:

1. They hit **Save** — the journal save API stores the story and kicks off CRE verification in the background
2. 3+ Chainlink DON nodes each independently call Gemini with the story text
3. All nodes agree: `{ significanceScore: 78, emotionalDepth: 4, qualityScore: 72, themes: ["resilience", "growth"] }`
4. The DON signs this result and writes it to the `VerifiedMetrics` contract on Base Sepolia
5. The story page's `useVerifiedMetrics` hook picks up the result on its next poll
6. The page displays a verification badge with the on-chain attestation

Anyone can call `getMetrics(storyId)` on Base Sepolia and see the exact same scores — no one can change them. This is particularly valuable for token rewards based on story quality or marketplace features — the metrics are provably fair.

---

## Contract Addresses

| Contract | Address | Chain |
|----------|---------|-------|
| VerifiedMetrics | `NEXT_PUBLIC_VERIFIED_METRICS_ADDRESS` (env var) | Base Sepolia (84532) |
| KeystoneForwarder | `0x82300bd7c3958625581cc2f77bc6464dcecdf3e5` | Base Sepolia |

## Environment Variables

| Var | Used By | Purpose |
|-----|---------|---------|
| `CRE_WORKFLOW_URL` | `/api/cre/trigger` | Chainlink CRE HTTP endpoint |
| `CRE_API_KEY` | `/api/cre/trigger` | Auth token for CRE workflow |
| `NEXT_PUBLIC_VERIFIED_METRICS_ADDRESS` | `/api/cre/check` | Contract address to read metrics |
| `GEMINI_API_KEY_ALL` | CRE workflow | Google Gemini API key (stored as CRE secret) |

## CRE CLI Commands

Run from the `cre/` directory:

```bash
# Simulate locally (no on-chain write)
cre workflow simulate iStory_workflow

# Simulate with on-chain broadcast (writes to testnet)
cre workflow simulate iStory_workflow --broadcast

# Deploy (requires Chainlink early access)
cre workflow deploy iStory_workflow
```

## Key Files Reference

| File | Purpose |
|------|---------|
| `app/api/journal/save/route.ts` | Saves story + auto-triggers CRE (line ~82) |
| `app/api/cre/trigger/route.ts` | Validates ownership, creates log, POSTs to CRE |
| `app/api/cre/check/route.ts` | Reads verified metrics from contract |
| `app/hooks/useVerifiedMetrics.ts` | Frontend polling hook |
| `cre/iStory_workflow/main.ts` | CRE workflow entry point |
| `cre/iStory_workflow/gemini.ts` | AI analysis with DON consensus |
| `cre/iStory_workflow/httpCallback.ts` | Full orchestration (7-step flow) |
| `contracts/VerifiedMetrics.sol` | On-chain metrics storage |
| `contracts/interfaces/ReceiverTemplate.sol` | Chainlink receiver base contract |
