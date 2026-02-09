# Chainlink CRE Skill

## Overview
Templates and patterns for building Chainlink CRE (Compute Runtime Environment) workflows.
CRE enables verifiable off-chain computation with on-chain attestation via Chainlink DON nodes.

## SDK
- Package: `@chainlink/cre-sdk` (v1.0.7+)
- Runtime: Bun (compiles TypeScript → WASM)
- CLI: `cre` command for deployment and secret management

## Templates

### `templates/workflow-ai.ts`
AI-powered workflow template. Fetches data via HTTP, processes with AI, writes results on-chain.
Use for: content verification, quality scoring, sentiment analysis.

### `templates/workflow-basic.ts`
Basic workflow template. HTTP trigger → compute → on-chain write.
Use for: simple data pipelines, price feeds, status checks.

### `templates/contract-verifier.sol`
Solidity contract template for receiving CRE workflow results.
Includes `onlyCRE` modifier for authorized forwarder pattern.

### `functions/ai-analysis.ts`
Reusable AI analysis function for CRE compute steps.
Calls Gemini Flash via HTTP for text analysis with structured output.

## Usage

### New Workflow
1. Copy `templates/workflow-ai.ts` to `cre/src/workflows/your-workflow/index.ts`
2. Customize trigger, compute, and action steps
3. Copy `templates/contract-verifier.sol` to `contracts/YourContract.sol`
4. Deploy contract, then workflow

### Commands
```bash
# Compile workflow
bun x cre-compile src/workflows/name/index.ts dist/name.wasm

# Set secrets
cre secrets set API_KEY "your-key"

# Deploy
cre workflow deploy dist/name.wasm

# Test locally
cre workflow test dist/name.wasm --trigger '{"body": "{}"}'
```

## Architecture
```
HTTP Trigger → CRE Workflow (DON nodes) → AI Analysis → On-Chain Write
                    ↓
              Consensus (multiple nodes verify same result)
                    ↓
              Cryptographic Attestation
```

## Security
- Secrets encrypted at rest, only available to DON nodes
- Results attested by multiple nodes (consensus)
- On-chain writes use authorized forwarder pattern
- Never hardcode API keys in workflow code
