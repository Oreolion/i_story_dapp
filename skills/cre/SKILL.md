# Chainlink CRE Skill

## Overview
Templates and patterns for building Chainlink CRE (Compute Runtime Environment) workflows.
CRE enables verifiable off-chain computation with on-chain attestation via Chainlink DON nodes.

## SDK
- Package: `@chainlink/cre-sdk` (v1.0.1+)
- Runtime: Bun (compiles TypeScript → WASM)
- CLI: `cre` command (v1.0.5+) for simulation and deployment
- Chain encoding: `viem` for ABI parameter encoding

## Project Structure (CRE CLI)

```
cre/                              # CRE project root
├── project.yaml                  # Global config: RPC URLs per chain
├── .env                          # Secrets: CRE_ETH_PRIVATE_KEY, GEMINI_API_KEY_ALL
├── secrets.yaml                  # Maps CRE secret IDs → env var names
├── <workflow-name>/              # Each workflow in its own directory
│   ├── main.ts                   # Entry point: Runner + HTTPCapability
│   ├── gemini.ts                 # AI analysis: HTTPClient consensus pattern
│   ├── httpCallback.ts           # Handler: parse → analyze → encode → sign → write
│   ├── workflow.yaml             # Workflow-specific targets and artifact paths
│   ├── config.staging.json       # Non-secret config (contract address, chain, gas)
│   ├── config.production.json    # Production config
│   ├── package.json              # Dependencies: @chainlink/cre-sdk, viem
│   └── tsconfig.json             # TypeScript config
```

**IMPORTANT**: CRE CLI expects this exact structure. Do NOT use `cre/src/` subdirectories.

## Correct SDK Patterns

### Entry Point (main.ts)
```typescript
import { cre, Runner } from "@chainlink/cre-sdk";
import { onHttpTrigger } from "./httpCallback";

export type Config = { /* matches config.staging.json */ };

const initWorkflow = (config: Config) => {
  const httpCapability = new cre.capabilities.HTTPCapability(); // NOT HTTPTrigger
  const httpTrigger = httpCapability.trigger({});
  return [cre.handler(httpTrigger, onHttpTrigger)];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
main();
```

### HTTP Trigger Handler
```typescript
import { type Runtime, type HTTPPayload, decodeJson } from "@chainlink/cre-sdk";

function onHttpTrigger(runtime: Runtime<Config>, payload: HTTPPayload): string {
  const input = decodeJson(payload.input) as TriggerInput; // NOT payload.body
  // ... process and return result
}
```

### Gemini AI (HTTPClient with DON consensus)
```typescript
import { cre, consensusIdenticalAggregation, type HTTPSendRequester } from "@chainlink/cre-sdk";

const geminiApiKey = runtime.getSecret({ id: "GEMINI_API_KEY" }).result();
const httpClient = new cre.capabilities.HTTPClient();
const result = httpClient
  .sendRequest(runtime, buildFn, consensusIdenticalAggregation<T>())
  (runtime.config).result();

// Inside buildFn: body MUST be base64-encoded
const body = Buffer.from(new TextEncoder().encode(JSON.stringify(data))).toString("base64");
// Response decoded: new TextDecoder().decode(resp.body)
```

### On-Chain Write (signed CRE report)
```typescript
import { getNetwork, hexToBase64, TxStatus, bytesToHex } from "@chainlink/cre-sdk";
import { encodeAbiParameters, parseAbiParameters } from "viem";

const network = getNetwork({ chainFamily: "evm", chainSelectorName: "ethereum-testnet-sepolia-base-1", isTestnet: true });
const evmClient = new cre.capabilities.EVMClient(network.chainSelector.selector);
const reportData = encodeAbiParameters(PARAMS, [args...]);
const reportResponse = runtime.report({ encodedPayload: hexToBase64(reportData), encoderName: "evm", signingAlgo: "ecdsa", hashingAlgo: "keccak256" }).result();
const writeResult = evmClient.writeReport(runtime, { receiver: contractAddr, report: reportResponse, gasConfig: { gasLimit: "500000" } }).result();
```

### Receiver Contract (Solidity)
```solidity
import {ReceiverTemplate} from "./interfaces/ReceiverTemplate.sol";

contract MyReceiver is ReceiverTemplate {
    constructor(address _forwarder) ReceiverTemplate(_forwarder) {}

    function _processReport(bytes calldata report) internal override {
        (bytes32 id, uint256 value) = abi.decode(report, (bytes32, uint256));
        // Store data...
    }
}
```
**KeystoneForwarder (Base Sepolia)**: `0x82300bd7c3958625581cc2f77bc6464dcecdf3e5`

## WRONG Patterns (will fail)

| Wrong | Correct |
|-------|---------|
| `cre.capabilities.HTTPTrigger` | `cre.capabilities.HTTPCapability` |
| `payload.body` (string) | `decodeJson(payload.input)` (Uint8Array) |
| `runtime.runInNodeMode(...)` | Direct calls on runtime |
| `nodeRuntime.httpClient.sendRequest({...})` | `httpClient.sendRequest(runtime, buildFn, consensus)` |
| `runtime.evmClient.writeReport({chainId, functionSignature})` | `evmClient.writeReport(runtime, {receiver, report, gasConfig})` |
| `JSON.parse(payload.body)` | `decodeJson(payload.input)` |
| `bun x cre-compile` | `cre workflow simulate` (CLI handles compilation) |
| `onlyCRE` modifier in contract | `ReceiverTemplate` with `_processReport()` |
| `storeVerifiedData()` direct call | `onReport()` via KeystoneForwarder |

## Templates

### `templates/workflow-ai.ts`
Complete AI workflow: HTTP trigger → Gemini analysis (HTTPClient consensus) → encode → sign → on-chain write.

### `templates/workflow-basic.ts`
Basic workflow: HTTP trigger → transform → encode → sign → on-chain write. No AI.

### `templates/contract-verifier.sol`
Solidity receiver contract extending ReceiverTemplate. Implements `_processReport()` to decode and store CRE report data.

### `functions/ai-analysis.ts`
Reusable Gemini analysis function with DON consensus. Drop into any workflow for text analysis.

## CLI Commands

```bash
# Initialize project
cre init

# Login (required for deployment)
cre login

# Simulate locally (no on-chain writes)
cre workflow simulate <workflow-folder>

# Simulate with on-chain broadcast (writes to testnet)
cre workflow simulate <workflow-folder> --broadcast

# Pipe JSON input (avoids terminal line-wrapping issues)
echo '{"key":"value"}' > input.json && cat input.json | cre workflow simulate <folder>

# Deploy (requires early access approval from Chainlink)
cre workflow deploy <workflow-folder>

# Update CLI
cre update
```

## Config Files

### project.yaml (at cre/ root)
```yaml
staging-settings:
  rpcs:
    - chain-name: ethereum-testnet-sepolia-base-1
      url: https://sepolia.base.org
```

### config.staging.json (per workflow)
```json
{
  "geminiModel": "gemini-2.0-flash",
  "evms": [{
    "contractAddress": "0x...",
    "chainSelectorName": "ethereum-testnet-sepolia-base-1",
    "gasLimit": "500000"
  }]
}
```

### secrets.yaml (maps secret IDs to env vars)
```yaml
secretsNames:
  GEMINI_API_KEY:
    - GEMINI_API_KEY_ALL
```

### .env
```
CRE_ETH_PRIVATE_KEY=0x...
CRE_TARGET=staging-settings
GEMINI_API_KEY_ALL=AIza...
```

## Chain Names
- Base Sepolia: `ethereum-testnet-sepolia-base-1`
- Ethereum Sepolia: `ethereum-testnet-sepolia`
- Use `cre workflow simulate --verbose` to see all supported chain names

## Security
- Secrets encrypted at rest via `secrets.yaml` + `.env`, only available to DON nodes
- Results attested by multiple nodes (consensus)
- On-chain writes go through KeystoneForwarder → ReceiverTemplate (forwarder validation)
- Never hardcode API keys in workflow code — use `runtime.getSecret()`
- Receiver contracts validate `msg.sender == forwarder` automatically

## Architecture
```
Frontend → POST /api/cre/trigger → CRE Workflow (DON nodes)
                                        ↓
                                   Gemini AI Analysis
                                        ↓
                                   DON Consensus (all nodes agree)
                                        ↓
                                   Signed CRE Report
                                        ↓
                                   KeystoneForwarder → Contract.onReport()
                                        ↓
                                   _processReport() → Store on-chain
                                        ↓
Frontend ← POST /api/cre/check ← Read from contract
```
