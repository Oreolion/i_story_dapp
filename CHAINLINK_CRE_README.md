# iStory x Chainlink CRE: Verified AI Metrics for Trustless Content Commerce

![Chainlink CRE](https://img.shields.io/badge/Chainlink-CRE-375BD2?logo=chainlink)
![Base Sepolia](https://img.shields.io/badge/Base-Sepolia-blue?logo=ethereum)
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?logo=solidity)
![Gemini](https://img.shields.io/badge/Gemini-2.0_Flash-4285F4?logo=google)

---

## The Problem

Content marketplaces have a trust gap. When creators paywall their stories, buyers have no way to verify quality before purchasing. AI-extracted metadata (themes, emotional depth, significance scores) could help buyers make informed decisions — but if that metadata is computed server-side by the creator's own platform, it can be faked, inflated, or manipulated.

**How does a buyer know a "95/100 quality score" is real and not self-assigned?**

## The Solution

**iStory uses Chainlink CRE to make AI-generated content metrics verifiable and trustless.**

Instead of trusting a single server, Chainlink's Decentralized Oracle Network (DON) runs the same AI analysis across multiple independent nodes. The nodes reach consensus on the results, cryptographically attest to them, and write the verified metrics directly on-chain — creating an immutable proof that buyers can independently verify before purchasing paywalled content.

```
Creator writes story
        |
        v
  Chainlink CRE DON
  (multiple nodes independently run Gemini AI analysis)
        |
        v
  Consensus reached → Cryptographic attestation
        |
        v
  On-chain write to VerifiedMetrics.sol (Base Sepolia)
        |
        v
  Buyer sees verified badge + metrics with on-chain proof
```

---

## What is iStory?

iStory is a Web3 AI-powered voice journaling dApp built on Base (Ethereum L2). Users record personal stories via voice, get AI transcription and enhancement, then publish to a social feed where stories can be liked, tipped, paywalled, and minted as NFTs.

**Key stack:** Next.js 15, React 19, Supabase, Wagmi/Viem, Hardhat, Google Gemini 2.0 Flash, ElevenLabs Scribe, Base Sepolia

**Live features:** Voice recording, AI transcription, AI story analysis, social feed, tipping, paywall system, NFT minting, follow system, notification system

---

## How Chainlink CRE is Used

### Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         iStory dApp                                 │
│                                                                     │
│  ┌──────────┐    ┌───────────────┐    ┌──────────────────────────┐  │
│  │  Record   │───>│ /api/journal/ │───>│ /api/cre/trigger         │  │
│  │  Page     │    │ save          │    │ (auth + ownership check) │  │
│  └──────────┘    └───────────────┘    └────────────┬─────────────┘  │
│                                                     │               │
│                                                     │ HTTP POST     │
│                                                     v               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   Chainlink CRE (DON Nodes)                  │   │
│  │                                                              │   │
│  │  1. Fetch story ──> GET /api/cre/content/[storyId]          │   │
│  │                     (authenticated with CRE_CONTENT_SECRET)  │   │
│  │                                                              │   │
│  │  2. AI Analysis ──> Gemini 2.0 Flash (temp=0.1 for          │   │
│  │                     consistency across nodes)                │   │
│  │                     Extract: significance, emotional depth,  │   │
│  │                     quality score, word count, themes        │   │
│  │                                                              │   │
│  │  3. Consensus ───> Multiple nodes verify same results        │   │
│  │                                                              │   │
│  │  4. On-chain ────> evmClient.writeReport() to               │   │
│  │                    VerifiedMetrics.sol (Base Sepolia)         │   │
│  │                                                              │   │
│  │  5. Callback ────> POST /api/cre/webhook                    │   │
│  │                    (authenticated with CRE_WEBHOOK_SECRET)   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                     │               │
│                                                     v               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Frontend Display                           │   │
│  │                                                              │   │
│  │  ┌──────────────┐  ┌────────────────────────────────────┐   │   │
│  │  │ VerifiedBadge│  │ VerifiedMetricsCard                │   │   │
│  │  │ ✓ Verified   │  │ Significance: 87/100 ████████░░   │   │   │
│  │  │ (BaseScan →) │  │ Quality:      92/100 █████████░   │   │   │
│  │  └──────────────┘  │ Emotional Depth: Deep             │   │   │
│  │                     │ Word Count: 1,247                 │   │   │
│  │                     │ Themes: growth, resilience, family│   │   │
│  │                     │ 🔗 View Proof (BaseScan)          │   │   │
│  │                     │ ─────────────────────────────────  │   │   │
│  │                     │ ✓ Verified by Chainlink CRE       │   │   │
│  │                     └────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### CRE Workflow: Step-by-Step

**1. Trigger** — When a user saves a story, the backend fires an async request to `/api/cre/trigger`, which creates a pending verification log and triggers the CRE workflow via HTTP.

**2. Fetch Content** — The CRE workflow running on DON nodes calls `/api/cre/content/[storyId]` to fetch the story's title and content. This endpoint is secured with a timing-safe secret comparison (`safeCompare`) — only CRE nodes with the correct `CRE_CONTENT_SECRET` can access it.

**3. AI Analysis** — Each DON node independently calls Google Gemini 2.0 Flash with the same prompt at temperature 0.1 (low randomness = consistent results across nodes). The AI extracts:

| Metric | Range | Description |
|--------|-------|-------------|
| Significance Score | 0-100 | How meaningful and impactful the story is |
| Emotional Depth | 1-5 | Surface → Mild → Moderate → Deep → Profound |
| Quality Score | 0-100 | Writing coherence, structure, vocabulary, flow |
| Word Count | integer | Exact word count |
| Themes | string[] | 2-5 main themes (e.g., "growth", "family") |

**4. Consensus** — DON nodes compare their results. Because all nodes run the same Gemini prompt with the same low temperature, they converge on the same metrics. The consensus produces a cryptographic attestation.

**5. On-Chain Write** — The CRE workflow calls `evmClient.writeReport()` to write the verified metrics to the `VerifiedMetrics.sol` smart contract on Base Sepolia. Only the authorized CRE forwarder address can call `storeVerifiedMetrics()` (enforced by the `onlyCRE` modifier).

**6. Webhook Callback** — After on-chain write, CRE sends results back to `/api/cre/webhook` (secured with `CRE_WEBHOOK_SECRET` via timing-safe comparison). The backend stores the metrics + tx hash + attestation ID in the `verified_metrics` database table.

**7. Frontend Display** — The `useVerifiedMetrics` hook polls the database. When metrics arrive, the `VerifiedBadge` component shows a green checkmark linked to the BaseScan transaction, and the `VerifiedMetricsCard` displays the full verified metrics with an on-chain proof link.

---

## CRE-Specific Code

### CRE Workflow (`cre/src/workflows/story-verification/index.ts`)

The workflow is a TypeScript module using the real `@chainlink/cre-sdk`. It defines an HTTP-triggered handler that orchestrates the entire verification pipeline:

```typescript
import { cre, type Runtime, type NodeRuntime } from "@chainlink/cre-sdk";

const handler = (runtime: Runtime<StoryVerificationConfig>, payload: HTTPPayload) => {
  const input = JSON.parse(payload.body);

  // Step 1: Fetch story (node mode for HTTP side effects)
  const story = runtime.runInNodeMode((nodeRuntime) => {
    return fetchStoryContent(nodeRuntime, input.storyId);
  });

  // Step 2: AI Analysis via Gemini (node mode)
  const metrics = runtime.runInNodeMode((nodeRuntime) => {
    return analyzeStory(nodeRuntime, story);
  });

  // Step 3: Write verified metrics on-chain
  runtime.evmClient.writeReport({
    chainId: 84532, // Base Sepolia
    contractAddress: runtime.config.verifiedMetricsAddress,
    functionSignature: "storeVerifiedMetrics(bytes32,address,uint8,uint8,uint8,uint32,string[],bytes32)",
    params: [storyIdBytes32, story.authorWallet, metrics.significanceScore, ...],
  });
};

const initWorkflow = (config: StoryVerificationConfig) => {
  const http = new cre.capabilities.HTTPTrigger();
  return [cre.handler(http.trigger({ method: "POST" }), handler)];
};
```

### Smart Contract (`contracts/VerifiedMetrics.sol`)

```solidity
contract VerifiedMetrics is Ownable {
    address public creForwarder;

    struct Metrics {
        uint8 significanceScore;   // 0-100
        uint8 emotionalDepth;      // 1-5
        uint8 qualityScore;        // 0-100
        uint32 wordCount;
        string[] themes;
        bytes32 attestationId;     // CRE proof
        uint256 verifiedAt;
        bool exists;
    }

    mapping(bytes32 => Metrics) public metrics;

    modifier onlyCRE() {
        require(msg.sender == creForwarder, "Only CRE forwarder");
        _;
    }

    function storeVerifiedMetrics(
        bytes32 storyId, address author,
        uint8 significanceScore, uint8 emotionalDepth,
        uint8 qualityScore, uint32 wordCount,
        string[] calldata themes, bytes32 attestationId
    ) external onlyCRE { ... }

    function getMetrics(bytes32 storyId) external view returns (...) { ... }
    function isVerified(bytes32 storyId) external view returns (bool) { ... }
}
```

### AI Analysis (`cre/src/workflows/story-verification/analyze.ts`)

The analysis function runs inside CRE's node mode, calling Gemini via the CRE HTTP client:

```typescript
export function analyzeStory(
  nodeRuntime: NodeRuntime<StoryVerificationConfig>,
  story: StoryContent
): StoryMetrics {
  const response = nodeRuntime.httpClient.sendRequest({
    url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": nodeRuntime.config.geminiApiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
    }),
  });
  // Parse, validate, clamp scores, deduplicate themes
  return validatedMetrics;
}
```

Temperature 0.1 is critical — it ensures all DON nodes get consistent results from the same AI model, enabling consensus.

---

## File Structure (CRE-Related)

```
i_story_dapp/
├── cre/                                          # CRE Workflow Project
│   ├── src/workflows/story-verification/
│   │   ├── index.ts                              # Main workflow (HTTP trigger → AI → on-chain)
│   │   └── analyze.ts                            # Gemini AI analysis + webhook callback
│   ├── project.yaml                              # CRE project config
│   ├── package.json                              # @chainlink/cre-sdk dependency
│   └── tsconfig.json
│
├── contracts/
│   └── VerifiedMetrics.sol                       # On-chain metrics storage (onlyCRE)
│
├── app/api/cre/
│   ├── trigger/route.ts                          # POST - Start CRE verification (auth + ownership)
│   ├── content/[storyId]/route.ts                # GET  - Serve content to CRE (secret-authenticated)
│   └── webhook/route.ts                          # POST - Receive CRE results (secret-authenticated)
│
├── app/api/journal/save/route.ts                 # Modified: auto-triggers CRE after story save
│
├── components/
│   ├── VerifiedBadge.tsx                         # Green "Verified" badge with BaseScan link
│   └── VerifiedMetricsCard.tsx                   # Full metrics card with scores + proof link
│
├── app/hooks/
│   └── useVerifiedMetrics.ts                     # React hook (polls while pending, auto-stops)
│
├── lib/contracts.ts                              # Updated: VERIFIED_METRICS_ADDRESS + ABI
├── scripts/deployVerifiedMetrics.ts              # Hardhat deployment script
│
├── skills/cre/                                   # CRE developer tooling templates
│   ├── SKILL.md
│   ├── templates/
│   │   ├── workflow-ai.ts                        # AI workflow template
│   │   ├── workflow-basic.ts                     # Basic workflow template
│   │   └── contract-verifier.sol                 # Contract template
│   └── functions/
│       └── ai-analysis.ts                        # Reusable analysis function
│
└── scripts/cre-agent.ts                          # Claude SDK agent for CRE problem-solving
```

---

## Database Schema (CRE Tables)

Created via Supabase migration with Row Level Security:

### `verified_metrics`

| Column | Type | Description |
|--------|------|-------------|
| `story_id` | UUID (FK → stories) | Story being verified |
| `significance_score` | SMALLINT (0-100) | Verified significance |
| `emotional_depth` | SMALLINT (1-5) | Verified emotional depth |
| `quality_score` | SMALLINT (0-100) | Verified quality |
| `word_count` | INTEGER | Verified word count |
| `verified_themes` | TEXT[] | Verified themes array |
| `cre_attestation_id` | TEXT | CRE cryptographic attestation |
| `cre_workflow_run_id` | TEXT | Workflow execution ID |
| `on_chain_tx_hash` | TEXT | Base Sepolia transaction hash |
| `on_chain_block_number` | BIGINT | Block number of on-chain write |

**RLS:** Public read (anyone can verify metrics), service_role-only write (only backend can store results).

### `verification_logs`

| Column | Type | Description |
|--------|------|-------------|
| `story_id` | UUID (FK → stories) | Story being verified |
| `workflow_run_id` | TEXT | CRE workflow run ID |
| `status` | TEXT | `pending` / `completed` / `failed` |

**RLS:** Authors can read their own stories' logs, service_role can write.

---

## Security Model

CRE integration follows the same security patterns as the rest of iStory (34 audit findings previously addressed):

| Endpoint | Auth Method | Details |
|----------|-------------|---------|
| `/api/cre/trigger` | Bearer JWT | `validateAuthOrReject()` + ownership verification (author_id check) |
| `/api/cre/content/[storyId]` | `X-CRE-Secret` header | Timing-safe `safeCompare()` from `lib/crypto.ts` |
| `/api/cre/webhook` | `X-Webhook-Secret` header | Timing-safe `safeCompare()` from `lib/crypto.ts` |
| On-chain writes | `onlyCRE` modifier | Only authorized CRE forwarder address can call `storeVerifiedMetrics()` |

All error responses use generic messages (never leak `error.message` to clients). Duplicate verification requests return 409 Conflict. The trigger route checks story existence, user ownership, and existing verification status before proceeding.

---

## API Routes

### `POST /api/cre/trigger`

Starts CRE verification for a story. Requires authentication and story ownership.

**Request:**
```json
{ "storyId": "uuid-of-story" }
```

**Response:**
```json
{ "success": true, "workflowRunId": "wf_1707300000_abc1234" }
```

**Error cases:** 401 (unauthorized), 403 (not story author), 404 (story not found), 409 (already verified or pending)

### `GET /api/cre/content/[storyId]`

Serves story content to CRE DON nodes. Authenticated via `X-CRE-Secret` header.

**Response:**
```json
{
  "id": "story-uuid",
  "title": "My Journey Home",
  "content": "Full story text...",
  "authorWallet": "0x..."
}
```

### `POST /api/cre/webhook`

Receives verified metrics from CRE after analysis. Authenticated via `X-Webhook-Secret` header.

**Request:**
```json
{
  "storyId": "uuid",
  "workflowRunId": "wf_...",
  "significanceScore": 87,
  "emotionalDepth": 4,
  "qualityScore": 92,
  "wordCount": 1247,
  "themes": ["growth", "resilience", "family"],
  "attestationId": "0x...",
  "txHash": "0x...",
  "blockNumber": 12345678
}
```

---

## Frontend Components

### VerifiedBadge

Three states with visual feedback:

| State | Display | Details |
|-------|---------|---------|
| `unverified` | Nothing rendered | Story has no CRE verification |
| `pending` | Yellow "Verifying..." badge with animated clock | CRE workflow in progress |
| `verified` | Green "Verified" badge with checkmark | Links to BaseScan transaction |

Integrated into: `StoryCard.tsx` (social feed), `story/[storyId]/page.tsx` (detail page)

### VerifiedMetricsCard

Full metrics display with:
- Significance and Quality progress bars (0-100)
- Emotional Depth badge (Surface/Mild/Moderate/Deep/Profound)
- Word count
- Verified themes as styled badges
- "View Proof" link to BaseScan transaction
- "Verified by Chainlink CRE" footer
- Pending state with "Multiple nodes are analyzing..." spinner

Integrated into: Paywalled story previews (buyers see metrics before purchasing) and story detail pages

### useVerifiedMetrics Hook

```typescript
const { metrics, isPending, isVerified, error, refetch } = useVerifiedMetrics(storyId);
```

- Fetches from `verified_metrics` table via Supabase client
- Falls back to checking `verification_logs` for pending status
- Polls every 5 seconds while `isPending` is true
- Auto-stops polling when metrics arrive

---

## Developer Tooling

### CRE Sub-Agent (`scripts/cre-agent.ts`)

A Claude SDK thinking agent specialized for CRE problem-solving. Includes a comprehensive CRE knowledge base as system prompt with real SDK patterns, workflow structure, HTTP/EVM client usage, and secrets management.

```bash
npx ts-node scripts/cre-agent.ts "How do I handle CRE workflow retries?"
```

### CRE Skills Templates (`skills/cre/`)

Reusable templates for building CRE workflows:
- `templates/workflow-ai.ts` — AI-powered workflow (HTTP → AI → on-chain)
- `templates/workflow-basic.ts` — Basic data pipeline workflow
- `templates/contract-verifier.sol` — Solidity contract with `onlyCRE` pattern
- `functions/ai-analysis.ts` — Reusable Gemini analysis function

---

## How to Run

### Prerequisites

- Node.js 18+, npm
- Bun (for CRE workflow compilation)
- Hardhat (for contract deployment)
- Supabase project (database)
- Base Sepolia testnet ETH

### 1. Install Dependencies

```bash
# Main app
npm install

# CRE workflow (in cre/ directory)
cd cre && bun install && cd ..
```

### 2. Environment Variables

Add to `.env.local`:

```env
# Existing iStory vars (Supabase, AI, Web3)
# ...

# CRE Integration
CRE_API_KEY=your_chainlink_cre_api_key
CRE_WORKFLOW_URL=https://your-cre-workflow-trigger-url
CRE_CONTENT_SECRET=a_strong_random_secret_for_content_endpoint
CRE_WEBHOOK_SECRET=a_strong_random_secret_for_webhook
NEXT_PUBLIC_VERIFIED_METRICS_ADDRESS=0x_deployed_contract_address
NEXT_PUBLIC_BLOCK_EXPLORER=https://sepolia.basescan.org
```

### 3. Deploy Smart Contract

```bash
npx hardhat compile
npx hardhat run scripts/deployVerifiedMetrics.ts --network baseSepolia
# Copy the printed address to .env.local and lib/contracts.ts
```

### 4. Deploy CRE Workflow

```bash
cd cre
cre secrets set GEMINI_API_KEY "your-gemini-key"
cre secrets set CONTENT_SECRET "same-as-CRE_CONTENT_SECRET"
cre secrets set WEBHOOK_SECRET "same-as-CRE_WEBHOOK_SECRET"
bun run compile
cre workflow deploy dist/story-verification.wasm
# Save workflow URL to .env.local as CRE_WORKFLOW_URL
```

### 5. Set CRE Forwarder

After CRE deployment, call `setCREForwarder()` on the VerifiedMetrics contract with the CRE forwarder address.

### 6. Run the App

```bash
npm run dev
# Open http://localhost:3000
```

### 7. Test the Flow

1. Connect wallet and sign in
2. Record or write a story on `/record`
3. Save the story — CRE verification triggers automatically
4. Watch the story detail page — badge changes from "Verifying..." to "Verified"
5. Click the verified badge — links to the BaseScan transaction
6. For paywalled stories, buyers see the verified metrics card before purchasing

---

## Why CRE for This Use Case?

| Traditional Approach | CRE Approach |
|---------------------|-------------|
| Server computes metrics | Multiple DON nodes compute independently |
| Creator/platform could fake scores | Consensus ensures no single party can manipulate |
| No proof of computation | Cryptographic attestation ID |
| Trust the platform | Trust the math (verify on-chain) |
| Metrics stored in mutable DB | Metrics anchored on immutable blockchain |
| Buyer has no recourse | Buyer can verify before purchasing |

**CRE solves the oracle problem for AI-generated content quality.** Just as Chainlink price feeds made DeFi possible by providing verified asset prices, CRE-verified content metrics make trustless content commerce possible.

---

## Tech Stack Summary

| Layer | Technology | CRE Role |
|-------|-----------|----------|
| **CRE Workflow** | `@chainlink/cre-sdk` v1.0.7, TypeScript → WASM via Bun | Orchestrates multi-node verification |
| **AI Analysis** | Google Gemini 2.0 Flash (temp=0.1) | Content analysis with consensus consistency |
| **Smart Contract** | Solidity 0.8.20, OpenZeppelin Ownable | On-chain metrics storage with `onlyCRE` |
| **Blockchain** | Base Sepolia (chain ID 84532) | Low-cost L2 for metrics storage |
| **Backend** | Next.js 15 API Routes, Supabase | Trigger, content serving, webhook handling |
| **Frontend** | React 19, Tailwind CSS 4, Framer Motion | Verified badge, metrics card, polling hook |
| **Security** | `safeCompare()`, Bearer JWT, `onlyCRE` modifier | Layered auth at every integration point |

---

## Team

- **Remi Adedeji** — Project Lead
  - Twitter: [@remyOreo_](https://twitter.com/remyOreo_)
  - Email: remyoreo11@gmail.com

## Links

- **GitHub:** [iStory Repository](https://github.com/your-repo/i_story_dapp)
- **CRE SDK:** [@chainlink/cre-sdk on npm](https://www.npmjs.com/package/@chainlink/cre-sdk)
- **CRE Docs:** [docs.chain.link/cre](https://docs.chain.link/cre)
- **Base Sepolia Explorer:** [sepolia.basescan.org](https://sepolia.basescan.org)

---

*Verified stories. Trustless commerce. Powered by Chainlink CRE.*
