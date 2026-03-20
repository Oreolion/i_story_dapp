# eStory — Privacy-Preserving AI-Powered Sovereign Storytelling Platform. Trustless and Tamper-Proof Quality and Significance Metrics Verification via Chainlink CRE

![Chainlink CRE](https://img.shields.io/badge/Chainlink-CRE-375BD2?logo=chainlink)
![Base Sepolia](https://img.shields.io/badge/Base-Sepolia-blue?logo=ethereum)
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?logo=solidity)
![Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?logo=google)

> Privacy-preserving AI-powered voice-first storytelling platform — from personal journals to history, geopolitics, and cultural narratives. Tamper-proof and trustless quality and significance metrics verification via Chainlink CRE on Base L2

---

## Table of Contents

- [The Problem — Three Civilizational Crises](#the-problem--three-civilizational-crises)
- [The Solution](#the-solution)
- [What is eStory?](#what-is-estory)
- [Privacy Architecture](#privacy-architecture)
- [How It Works — The Full Pipeline](#how-it-works--the-full-pipeline)
- [CRE Workflow Deep Dive](#cre-workflow-deep-dive)
- [Smart Contract](#smart-contract)
- [API Routes](#api-routes)
- [Frontend](#frontend)
- [File Structure](#file-structure)
- [Security Model](#security-model)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Demo](#demo)
- [Tech Stack](#tech-stack)
- [Team](#team)
- [Links](#links)

---

## The Problem — Three Civilizational Crises

eStory is a convergent solution to three compounding crises in human civilization:

### The Ancient Crisis — Memory Extinction

Throughout history, the vast majority of human experience has simply vanished. Oral traditions died with their keepers. Cultural narratives, indigenous knowledge, and local histories disappeared when communities couldn't preserve them. Before recording technology, entire lifetimes of personal and collective narrative — the daily emotions, reflections, turning points, historical accounts, and cultural wisdom — were permanently lost. Humanity has always lacked infrastructure to capture and preserve stories at scale — whether personal journals or chronicles of civilizations.

### The Present Crisis — The Unexamined Life at Scale

We are living through a civilizational inflection point — the AI revolution — comparable to the Renaissance and the Industrial Revolution. Future generations will look back at this era and ask how we navigated it, what we felt, what we feared, what we hoped for. Yet most people are too overwhelmed to document it. Writing — whether personal journals, historical analysis, geopolitical commentary, or cultural storytelling — declutters the mind, reduces anxiety, and sharpens thinking. Science has proven this repeatedly. But platforms that could enable it harvest our most intimate data with zero transparency. AI systems analyze our behavior, but we can't verify their outputs or trust their operators. There's no ownership of insights derived from your own words, and no privacy guarantee that survives a terms-of-service update. The people living through this historic moment need a sovereign space to process it — whether through private reflection or public storytelling — and a guarantee that their narratives remain theirs.

### The Emerging Crisis — The Meaning Void

As AI automates work at an accelerating pace, millions will lose not just jobs but their primary source of identity and purpose. When the thing you did for a living no longer needs you, an existential vacuum opens. People will search for what fills that gap — and storytelling, creative self-expression, and the craft of writing are among the oldest and most fulfilling answers humanity has ever found. The act of writing about history, analyzing geopolitics, preserving cultural narratives, or documenting personal growth isn't just recording — it's a practice that builds skill, deepens understanding, and creates purpose. But in a world flooded with AI-generated content, how do you prove your story is authentically yours? Without verifiable provenance, genuine human narrative drowns in synthetic noise. The tools people turn to for meaning must also protect the authenticity of what they create.

### The Trust Gap

Even beyond these crises, content marketplaces have a fundamental trust problem. When creators paywall their stories, buyers have no way to verify quality before purchasing. AI-extracted metadata (themes, emotional depth, quality scores) could help — but if that metadata is computed server-side, **it can be faked, inflated, or manipulated.**

**How does a buyer know a "95/100 quality score" is real and not self-assigned?**

---

## The Solution

**eStory uses Chainlink CRE to make AI-generated content metrics verifiable, trustless, and privacy-preserving.**

Instead of trusting a single server, Chainlink's Decentralized Oracle Network (DON) runs the same AI analysis across multiple independent nodes inside encrypted enclaves. The nodes reach consensus, and the system performs a **dual-write**:

- **On-chain:** Only minimal cryptographic proofs (quality tier, threshold, hashes) — no sensitive data
- **Off-chain:** Full metrics stored in Supabase, visible only to the story's author

Anyone can verify that a story was analyzed and meets quality standards. Only the author sees the intimate details. **Chainlink doesn't replace the AI — it makes the AI trustworthy while preserving privacy.**

---

## What is eStory?

eStory is a Web3 AI-powered sovereign storytelling platform built on Base (Ethereum L2). Users write and record stories about anything they're passionate about — personal journals, historical narratives, geopolitical analysis, cultural stories, creative non-fiction — using voice or text. AI transcribes, enhances, and analyzes each story, providing craft feedback that helps users become better storytellers over time. Stories can be kept private in an encrypted vault or published to a social feed where they can be liked, tipped, paywalled, and minted as NFTs.

**Story types:** Personal journals & reflections, historical essays & analysis, geopolitical commentary, cultural narratives & oral histories, creative non-fiction & memoirs

**Key features:** Voice recording, AI transcription (ElevenLabs Scribe), AI story analysis & craft feedback (Gemini 2.5 Flash), client-side encryption (AES-256-GCM vault), social feed, tipping, paywall system, NFT minting, follow system, notifications, CRE-verified metrics, storytelling improvement tracking

**Tech stack:** Next.js 15, React 19, Tailwind CSS 4, shadcn/ui, Wagmi 2 / Viem, RainbowKit, Hardhat, Supabase, Google Gemini 2.5 Flash, ElevenLabs Scribe, Claude SDK, Dexie.js (IndexedDB), Web Crypto API, Resend, Base Sepolia

---

## Privacy Architecture

eStory handles deeply personal and valuable content — from private journals to publishable stories. Users self-censor when their analysis data is broadcast on a public blockchain. The privacy-preserving CRE integration solves this with a **dual-write model**:

### What's Public (On-Chain)

| Field | Description |
|-------|-------------|
| `qualityTier` | 1-5 ("Developing" / "Fair" / "Good" / "High Quality" / "Exceptional") — not the exact score |
| `meetsQualityThreshold` | Boolean: qualityScore >= 70 |
| `metricsHash` | `keccak256(abi.encode(scores, themes, salt))` — provable but not reversible |
| `authorCommitment` | `keccak256(abi.encodePacked(walletAddress, storyId))` — proves ownership without exposing address |
| `attestationId` | Links to the CRE attestation |

### What's Private (Supabase, Author-Only)

| Field | Description |
|-------|-------------|
| Significance Score | 0-100 — how meaningful and impactful |
| Emotional Depth | 1-5 — Surface → Mild → Moderate → Deep → Profound |
| Quality Score | 0-100 — writing coherence, structure, vocabulary, flow |
| Word Count | Exact word count |
| Themes | 2-5 main themes (e.g., "growth", "resilience", "family") |

### In Practice

```
On-chain (public):   "Verified, High Quality (Tier 4), meets threshold ✓"
Off-chain (author):  "Significance: 78, Emotional Depth: 4/5, Quality: 72, Themes: growth, resilience"
Off-chain (public):  [nothing — only the on-chain proof is visible]
```

### Why This Matters

- **Authors can prove** their stories were fairly analyzed without broadcasting scores
- **Buyers can verify** quality tier and threshold before purchasing paywalled content
- **metricsHash** acts as a zero-knowledge-like proof — anyone with the full metrics can verify the hash matches, without the hash revealing the metrics
- **authorCommitment** lets authors prove ownership on-chain without the commitment being reversible by the public

---

## How It Works — The Full Pipeline

```
User records/writes a story and hits Save
       │
       v
  /api/journal/save
       │  1. Saves story to Supabase
       │  2. Triggers local AI analysis (Gemini, for immediate insights)
       │  3. Triggers CRE verification (fire-and-forget, async)
       v
  /api/cre/trigger
       │  Validates auth + ownership
       │  Creates verification_logs entry (status: "pending")
       │  POSTs story content to Chainlink CRE workflow URL
       v
  ┌─────────────────────────────────────────────────────┐
  │           Chainlink DON (Encrypted Enclaves)        │
  │                                                     │
  │  Step 1: Parse & validate payload                   │
  │  Step 2: Gemini AI analysis via ConfidentialHTTPClient │
  │          (story content encrypted, nodes can't read it) │
  │          consensusIdenticalAggregation enforced      │
  │  Step 3: Derive privacy fields                      │
  │          qualityTier, meetsThreshold,                │
  │          metricsHash = keccak256(scores + themes + salt) │
  │          authorCommitment = keccak256(wallet + storyId) │
  │  Step 4: Network setup (Base Sepolia EVMClient)     │
  │  Step 5: ABI-encode minimal data only               │
  │  Step 6: Generate CRE report (ECDSA signed)         │
  │  Step 7: Write on-chain → PrivateVerifiedMetrics.sol │
  │  Step 8: Callback full metrics → /api/cre/callback  │
  └─────────────────────────────────────────────────────┘
       │
       │ DUAL WRITE:
       │
       ├──► [On-Chain] KeystoneForwarder → PrivateVerifiedMetrics.sol
       │       Stores: qualityTier, meetsThreshold, metricsHash,
       │               authorCommitment, attestationId
       │       Emits: MetricsVerified(storyId, authorCommitment, tier, threshold)
       │       *** NO scores, NO themes, NO wallet address ***
       │
       └──► [Off-Chain] ConfidentialHTTPClient → /api/cre/callback
               Stores: full scores, themes, word count, tx hash
               (Supabase verified_metrics table)
               Idempotent upsert (handles multiple DON nodes)
       │
       v
  /api/cre/check (author-based response filtering)
       │  Author request  → full metrics + on-chain proof
       │  Public request  → proof only (tier, threshold)
       v
  useVerifiedMetrics hook → UI
       │  Author view: progress bars, scores, themes
       │  Public view: star rating, quality tier, "CRE Verified" badge
```

---

## CRE Workflow Deep Dive

### Entry Point (`cre/iStory_workflow/main.ts`)

Sets up an HTTP-triggered CRE workflow using `@chainlink/cre-sdk`:

```typescript
import { CRE } from "@chainlink/cre-sdk";

const workflow = CRE.init({
  triggers: [new HTTPTrigger()],
  config: {
    geminiModel: "gemini-2.5-flash",
    callbackUrl: "https://app.estory.xyz/api/cre/callback",
    owner: "vault-don-owner",
    evms: [{ chainId: 84532 /* Base Sepolia */, gasLimit: 500000 }],
  },
});
```

### Confidential AI Analysis (`cre/iStory_workflow/gemini.ts`)

Uses **`ConfidentialHTTPClient`** — story content stays encrypted inside the DON enclave. Node operators never see journal text.

```typescript
// ConfidentialHTTPClient ensures story text is encrypted in transit within the DON
const response = await confidentialHttpClient.post(geminiUrl, {
  contents: [{ parts: [{ text: analysisPrompt }] }],
  generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
});

// All nodes must agree on the result
return consensusIdenticalAggregation<StoryMetrics>(response);
```

**Temperature 0.1** is critical — ensures all DON nodes get consistent results from the same prompt, enabling consensus.

### 8-Step Orchestrator (`cre/iStory_workflow/httpCallback.ts`)

| Step | Action | Privacy Impact |
|------|--------|----------------|
| 1 | Parse & validate payload | Check storyId, content, authorWallet |
| 2 | Gemini AI analysis via ConfidentialHTTPClient | Content encrypted in enclave |
| 3 | Derive privacy fields | `metricsHash`, `authorCommitment` computed |
| 4 | Network setup | Base Sepolia EVMClient created |
| 5 | ABI-encode minimal data | **Only** storyId, commitment, threshold, tier, hash, attestationId |
| 6 | Generate CRE report | ECDSA signing + Keccak256 hashing |
| 7 | Write on-chain | `evmClient.writeReport()` to PrivateVerifiedMetrics |
| 8 | Callback full metrics | ConfidentialHTTPClient POST to `/api/cre/callback` |

---

## Smart Contract

### `PrivateVerifiedMetrics.sol`

Inherits from Chainlink's `ReceiverTemplate`. Stores **only minimal cryptographic proofs**:

```solidity
struct MinimalMetrics {
    bool meetsQualityThreshold;  // qualityScore >= 70
    uint8 qualityTier;           // 1-5 (derived from qualityScore ranges)
    bytes32 metricsHash;         // keccak256(all scores + themes + salt)
    bytes32 authorCommitment;    // keccak256(walletAddress, storyId)
    bytes32 attestationId;       // CRE attestation reference
    uint256 verifiedAt;          // Block timestamp
    bool exists;                 // Existence flag
}
```

**Privacy verification helpers:**

```solidity
// Author can prove ownership by recomputing the commitment
function verifyAuthor(bytes32 storyId, address author) external view returns (bool) {
    bytes32 computed = keccak256(abi.encodePacked(author, storyId));
    return metrics[storyId].authorCommitment == computed;
}

// Anyone with full metrics can verify integrity against the hash
function verifyMetricsHash(bytes32 storyId, bytes32 hash) external view returns (bool) {
    return metrics[storyId].metricsHash == hash;
}
```

**On-chain security:** `_processReport()` validates `msg.sender == KeystoneForwarder` (Chainlink's authorized on-chain relay). Only CRE-signed reports can write to the contract.

### Legacy Contract (`contracts/legacy/VerifiedMetrics.sol`)

The original contract stored full scores on-chain (significance, emotional depth, quality, themes). Kept for backward compatibility with already-verified stories. New verifications use `PrivateVerifiedMetrics`.

### Deployed Addresses (Base Sepolia)

| Contract | Address |
|----------|---------|
| PrivateVerifiedMetrics (current) | `0x158e08BCD918070C1703E8b84a6E2524D2AE5e4c` |
| VerifiedMetrics (legacy) | `0x052B52A4841080a98876275d5f8E6d094c9E086C` |
| KeystoneForwarder (Chainlink) | `0x82300bd7c3958625581cc2f77bc6464dcecdf3e5` |

---

## API Routes

### `POST /api/cre/trigger`

Starts CRE verification for a story. Called automatically after journal save.

**Auth:** Bearer JWT via `validateAuthOrReject()` + story ownership check

**Request:**
```json
{ "storyId": "uuid-of-story" }
```

**Response:**
```json
{ "success": true, "message": "CRE verification triggered" }
```

**Errors:** 401 (unauthorized), 403 (not story author), 404 (story not found), 409 (already verified or pending)

**Fallback:** If `CRE_WORKFLOW_URL` is not set, runs direct Gemini analysis (no on-chain attestation, marked as "direct" source).

---

### `POST /api/cre/callback`

Receives full metrics from CRE DON nodes after analysis.

**Auth:** `X-CRE-Callback-Secret` header validated with timing-safe `safeCompare()` from `lib/crypto.ts`

**Request (from DON nodes):**
```json
{
  "storyId": "uuid",
  "significanceScore": 78,
  "emotionalDepth": 4,
  "qualityScore": 72,
  "wordCount": 1247,
  "themes": ["growth", "resilience"],
  "metricsHash": "0xabc...",
  "qualityTier": 4,
  "meetsQualityThreshold": true,
  "attestationId": "0x...",
  "txHash": "0x..."
}
```

**Behavior:**
- Idempotent upsert (multiple DON nodes call independently)
- Clamps all numeric values for defense-in-depth
- Updates `verification_logs` status to "completed"
- Always returns `{ success: true }` for DON consensus

---

### `POST /api/cre/check`

Reads verified metrics with **author-based filtering**.

**Auth:** Bearer JWT via `validateAuthOrReject()`

**Request:**
```json
{ "storyId": "uuid", "isAuthor": true }
```

**Response (author):**
```json
{
  "verified": true,
  "metrics": {
    "significanceScore": 78,
    "emotionalDepth": 4,
    "qualityScore": 72,
    "wordCount": 1247,
    "themes": ["growth", "resilience"]
  },
  "proof": {
    "qualityTier": 4,
    "meetsQualityThreshold": true,
    "metricsHash": "0xabc...",
    "txHash": "0x...",
    "verifiedAt": 1709123456
  }
}
```

**Response (public):**
```json
{
  "verified": true,
  "proof": {
    "qualityTier": 4,
    "meetsQualityThreshold": true
  }
}
```

**Read strategy:** Supabase cache → on-chain contract → legacy contract fallback

---

## Frontend

### `useVerifiedMetrics` Hook

```typescript
const {
  metrics,      // Full scores/themes (author only, null for public)
  proof,        // Minimal proof (always available if verified)
  isPending,    // CRE workflow still running
  isVerified,   // !!proof
  isAuthor,     // Is caller the story author?
  error,
  refetch,
} = useVerifiedMetrics(storyId);
```

- Polls every 10 seconds while `isPending`
- Auto-stops when metrics arrive
- Handles both immediate cache hits and async CRE verification

### Author View (Full Metrics)

- Significance and Quality progress bars (0-100)
- Emotional Depth badge (Surface / Mild / Moderate / Deep / Profound)
- Word count
- Verified themes as styled badges
- "View Proof" link to BaseScan transaction
- "Verified by Chainlink CRE" footer

### Public View (Proof Only)

- Quality tier as 1-5 star rating with label
- "CRE Verified" shield badge
- "Meets Quality Threshold" checkmark
- No scores, no themes visible

---

## File Structure

```
i_story_dapp/
├── cre/                                    # CRE Workflow Project
│   └── iStory_workflow/
│       ├── main.ts                         # Workflow entry (HTTP trigger + config)
│       ├── gemini.ts                       # Confidential Gemini AI query + consensus
│       ├── httpCallback.ts                 # 8-step orchestrator (privacy hashing → on-chain → callback)
│       ├── package.json                    # @chainlink/cre-sdk dependency
│       └── tsconfig.json
│
├── contracts/
│   ├── PrivateVerifiedMetrics.sol          # Privacy-preserving on-chain storage (current)
│   ├── legacy/
│   │   └── VerifiedMetrics.sol             # Old contract, full data on-chain (backward compat)
│   └── interfaces/
│       ├── ReceiverTemplate.sol            # Chainlink receiver base contract
│       ├── IReceiver.sol                   # Receiver interface
│       └── IERC165.sol                     # ERC-165 interface detection
│
├── app/api/cre/
│   ├── trigger/route.ts                    # POST — Start CRE verification (auth + ownership)
│   ├── callback/route.ts                   # POST — Receive full metrics from DON nodes
│   └── check/route.ts                      # POST — Author-filtered metrics reading
│
├── app/hooks/
│   └── useVerifiedMetrics.ts               # React hook (metrics + proof, polling, isAuthor)
│
├── components/
│   ├── VerifiedMetricsCard.tsx             # Full metrics card (author) / proof card (public)
│   └── VerifiedBadge.tsx                   # Badge with quality tier label
│
├── lib/
│   ├── contracts.ts                        # Contract addresses + ABIs
│   ├── auth.ts                             # validateAuthOrReject, validateWalletOwnership
│   └── crypto.ts                           # safeCompare (timing-safe string comparison)
│
├── scripts/
│   ├── deploy.ts                           # Hardhat deployment (all contracts)
│   └── verify-deployment.ts                # Post-deploy verification
│
├── skills/cre/                             # CRE developer tooling
│   ├── SKILL.md                            # CRE SDK patterns reference
│   ├── templates/                          # Reusable workflow templates
│   └── functions/                          # Reusable analysis functions
│
├── scripts/cre-agent.ts                    # Claude SDK agent for CRE problem-solving
│
└── docs/
    └── CHAINLINK_CRE.md                    # Internal CRE architecture docs (55 pages)
```

---

## Security Model

Eight layers of defense:

| Layer | Mechanism | Details |
|-------|-----------|---------|
| 1 | **API Authentication** | All routes use `validateAuthOrReject()` with Bearer JWT |
| 2 | **Callback Authentication** | `X-CRE-Callback-Secret` with timing-safe `safeCompare()` |
| 3 | **Ownership Verification** | `/api/cre/trigger` checks user owns story before triggering |
| 4 | **Confidential HTTP** | Story content encrypted inside DON enclave via `ConfidentialHTTPClient` |
| 5 | **DON Consensus** | Multiple independent nodes must agree on Gemini result |
| 6 | **Forwarder Validation** | `ReceiverTemplate.onReport()` verifies `msg.sender == KeystoneForwarder` |
| 7 | **On-chain Privacy** | No raw scores, themes, or wallet addresses stored on-chain |
| 8 | **Author-based Filtering** | `/api/cre/check` returns full metrics only to the story author |

All error responses use generic messages (never leak `error.message` to clients). Duplicate verification requests return 409 Conflict.

---

## Database Schema

### `verified_metrics`

| Column | Type | Description |
|--------|------|-------------|
| `story_id` | UUID (unique) | Story being verified |
| `significance_score` | INTEGER (0-100) | Verified significance |
| `emotional_depth` | INTEGER (1-5) | Verified emotional depth |
| `quality_score` | INTEGER (0-100) | Verified quality |
| `word_count` | INTEGER | Verified word count |
| `verified_themes` | TEXT[] | Verified themes array |
| `metrics_hash` | TEXT | keccak256 proof for integrity |
| `quality_tier` | INTEGER (1-5) | Derived from quality_score |
| `meets_quality_threshold` | BOOLEAN | qualityScore >= 70 |
| `cre_attestation_id` | TEXT | CRE attestation reference |
| `on_chain_tx_hash` | TEXT | Base Sepolia transaction hash |
| `updated_at` | TIMESTAMP | Last update time |

### `verification_logs`

| Column | Type | Description |
|--------|------|-------------|
| `story_id` | UUID | Story being verified |
| `workflow_run_id` | TEXT | CRE workflow run ID |
| `status` | TEXT | `pending` / `completed` / `failed` |
| `created_at` | TIMESTAMP | When verification was triggered |
| `updated_at` | TIMESTAMP | Last status change |

---

## Getting Started

### Prerequisites

- Node.js 18+, npm
- CRE CLI installed (`cre version`)
- Hardhat (for contract deployment)
- Supabase project (database + auth)
- Base Sepolia testnet ETH (for contract deployment + gas)
- Google Gemini API key

### 1. Install Dependencies

```bash
# Main app
npm install

# CRE workflow
cd cre/iStory_workflow && npm install && cd ../..
```

### 2. Environment Variables

Add to `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# CRE Integration
CRE_WORKFLOW_URL=https://your-cre-workflow-trigger-url
CRE_API_KEY=your_chainlink_cre_api_key
CRE_CALLBACK_SECRET=a_strong_random_secret_for_callback
GEMINI_API_KEY_ALL=your_gemini_api_key

# Contracts (Base Sepolia)
NEXT_PUBLIC_VERIFIED_METRICS_ADDRESS=0x158e08BCD918070C1703E8b84a6E2524D2AE5e4c
NEXT_PUBLIC_LEGACY_VERIFIED_METRICS_ADDRESS=0x052B52A4841080a98876275d5f8E6d094c9E086C
NEXT_PUBLIC_BLOCK_EXPLORER=https://sepolia.basescan.org

# Web3
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_id
```

### 3. Deploy Smart Contract (if needed)

```bash
npx hardhat compile
npx hardhat run scripts/deploy.ts --network baseSepolia
npx hardhat run scripts/verify-deployment.ts --network baseSepolia
```

### 4. Run Database Migrations

```bash
# Apply via Supabase dashboard or CLI
# Migrations: 005_create_waitlist_table.sql, 006_create_verified_metrics_tables.sql
```

### 5. Run the App

```bash
npm run dev
# Open http://localhost:3000
```

### 6. Test the Flow

1. Connect wallet and sign in
2. Record or write a story on `/record`
3. Save the story — CRE verification triggers automatically
4. Watch the story detail page — badge changes from "Verifying..." to "Verified"
5. Click the verified badge — links to the BaseScan transaction
6. View as author → see full metrics (scores, themes)
7. View as public → see proof only (tier, threshold badge)

---

## Demo

### CRE CLI Simulation

```bash
cd cre

# Create demo input
cat > demo-input.json << 'EOF'
{
  "storyId": "11111111-1111-4111-8111-111111111111",
  "title": "Demo: CRE verification run",
  "content": "Today I faced a significant challenge at work that forced me to reconsider my approach to problem-solving. The morning started with an unexpected message from my team lead, informing me that our main project had hit a critical roadblock. Instead of panicking, I took a deep breath and began mapping out alternative solutions. By the end of the day, not only had we found a workaround, but the new approach was actually more elegant than the original plan. Sometimes obstacles are just opportunities in disguise.",
  "authorWallet": "0x0000000000000000000000000000000000000001"
}
EOF

# Dry run (no on-chain write)
cat demo-input.json | cre workflow simulate iStory_workflow

# With on-chain broadcast (writes to Base Sepolia)
cat demo-input.json | cre workflow simulate iStory_workflow --broadcast
```

### Expected Output (8 Steps)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRE Workflow: eStory Privacy-Preserving Verification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Step 1] Processing story: 11111111-1111-4111-8111-111111111111
[Step 2] Querying Gemini AI (confidential enclave)...
         Results: significance=78, emotionalDepth=4, quality=72
[Step 3] Deriving privacy-preserving fields...
         qualityTier=4, meetsThreshold=true
         metricsHash=0xabc...
         authorCommitment=0xdef...
[Step 4] Target chain: ethereum-testnet-sepolia-base-1
[Step 5] Encoding minimal privacy-preserving data...
[Step 6] Generating CRE report (ECDSA signed)...
[Step 7] On-chain write successful: 0x1a2b3c4d...
[Step 8] Sending full metrics via confidential callback...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Verify Privacy On-Chain

```bash
# Read from contract — only minimal data visible
cast call 0x158e08BCD918070C1703E8b84a6E2524D2AE5e4c \
  "getMetrics(bytes32)(bool,uint8,bytes32,bytes32,bytes32,uint256)" \
  0x3131313131313131313131313131313131313131313131313131313131313131 \
  --rpc-url https://sepolia.base.org

# Returns: (true, 4, 0xabc...hash, 0xdef...commitment, 0x123...attestation, 1709123456)
# NO scores, NO themes, NO wallet address visible on-chain
```

### Presentation Checklist

- [ ] Save a story in the app → show `verification_logs` row with `status = "pending"`
- [ ] Run `cre workflow simulate iStory_workflow` → show 8-step CRE logs
- [ ] Show on-chain proof via `getMetrics()` → only minimal fields visible
- [ ] Show `/api/cre/callback` result in `verified_metrics` table → full scores, themes
- [ ] In the app, refresh as author → full metrics with progress bars
- [ ] View same story as public → proof only (tier, threshold badge)
- [ ] Highlight: same story, two views — privacy preserved

---

## Tech Stack

| Layer | Technology | CRE Role |
|-------|-----------|----------|
| **CRE Workflow** | `@chainlink/cre-sdk`, TypeScript → WASM | Orchestrates multi-node verification |
| **AI Analysis** | Google Gemini 2.5 Flash (temp=0.1) | Content analysis with DON consensus |
| **Smart Contract** | Solidity 0.8.20, ReceiverTemplate | Privacy-preserving on-chain proofs |
| **Blockchain** | Base Sepolia (chain ID 84532) | Low-cost L2 for immutable attestations |
| **Backend** | Next.js 15 API Routes, Supabase | Trigger, callback, author-filtered reads |
| **Frontend** | React 19, Tailwind CSS 4, shadcn/ui | Dual author/public metrics display |
| **Client Encryption** | AES-256-GCM, PBKDF2, AES-KW (Web Crypto API) | Client-side vault for journal entries |
| **Security** | `safeCompare()`, Bearer JWT, `ReceiverTemplate` | 8-layer defense at every integration point |

---

## What Makes This Novel

1. **Privacy-First Design** — Most CRE projects store full data on-chain. eStory stores only cryptographic proofs, preserving user privacy while enabling auditability.

2. **Dual-Write Architecture** — Simultaneously writes minimal proofs on-chain (immutable, auditable) and full metrics off-chain (private, author-only). This is a sophisticated pattern for privacy-preserving verifiable compute.

3. **Author Commitment Hashing** — `keccak256(wallet, storyId)` commitment allows authors to prove ownership without the commitment being reversible by the public.

4. **Metrics Hash Integrity Proofs** — The `metricsHash` is a zero-knowledge-like proof — anyone with the full metrics can verify the hash matches, without the hash revealing the metrics.

5. **Real Use Case Alignment** — Combining verifiable AI with privacy is perfect for storytelling — from private journals to public essays on history and geopolitics. Authors need verified quality metrics for paywalled content, while keeping personal analysis private. The same platform serves both intimate reflection and publishable non-fiction.

6. **Graceful Fallback** — If CRE isn't deployed, the system falls back to direct Gemini analysis (no on-chain proof, but same AI quality). Production-ready thinking.

---

## Challenges We Ran Into

1. **Privacy vs Verifiability Tradeoff** — Designing the dual-write architecture where on-chain data proves integrity without leaking analysis details. Solved with `metricsHash` (keccak256 commitment to full scores) and `authorCommitment` (keccak256 of wallet + storyId).

2. **DON Consensus with AI** — Ensuring multiple independent nodes get identical Gemini results for `consensusIdenticalAggregation`. Required deterministic prompt engineering (temperature 0.1, structured JSON output, explicit scoring rubrics).

3. **Idempotent Callback Handling** — Multiple DON nodes independently call the callback endpoint. Solved with Supabase upsert and timing-safe secret validation (`safeCompare`).

4. **CRE SDK Patterns** — Early-access SDK required careful adherence to specific patterns (`ConfidentialHTTPClient` vs `HTTPClient`, Vault DON secrets vs `runtime.getSecret()`, report generation with ECDSA signing).

---

## Team

**Remi Adedeji** — Project Lead & Full-Stack Developer

- Twitter: [@remyOreo_](https://twitter.com/remyOreo_)
- Email: remyoreo11@gmail.com
- GitHub: [Oreolion](https://github.com/Oreolion)

---

## Links

- **GitHub:** [github.com/Oreolion/i_story_dapp](https://github.com/Oreolion/i_story_dapp)
- **CRE Workflow Code:** [cre/iStory_workflow/](https://github.com/Oreolion/i_story_dapp/tree/master/cre/iStory_workflow)
- **Privacy Contract:** [contracts/PrivateVerifiedMetrics.sol](https://github.com/Oreolion/i_story_dapp/blob/master/contracts/PrivateVerifiedMetrics.sol)
- **CRE API Routes:** [app/api/cre/](https://github.com/Oreolion/i_story_dapp/tree/master/app/api/cre)
- **Architecture Docs:** [docs/CHAINLINK_CRE.md](https://github.com/Oreolion/i_story_dapp/blob/master/docs/CHAINLINK_CRE.md)
- **CRE SDK:** [@chainlink/cre-sdk on npm](https://www.npmjs.com/package/@chainlink/cre-sdk)
- **Base Sepolia Explorer:** [sepolia.basescan.org](https://sepolia.basescan.org)
- **Contract on BaseScan:** [0x158e08BCD918070C1703E8b84a6E2524D2AE5e4c](https://sepolia.basescan.org/address/0x158e08BCD918070C1703E8b84a6E2524D2AE5e4c)

---

*Verified stories. Private by default. From personal journals to world-changing narratives. Powered by Chainlink CRE on Base.*
