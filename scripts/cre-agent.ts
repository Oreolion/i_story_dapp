// File: scripts/cre-agent.ts
// CRE Sub-Agent: Claude SDK thinking agent specialized for Chainlink CRE problem-solving
// Run with: npx ts-node scripts/cre-agent.ts "your CRE question"

import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const CRE_KNOWLEDGE_BASE = `
# Chainlink CRE (Compute Runtime Environment) Knowledge Base

## Overview
CRE is Chainlink's serverless compute platform for building decentralized workflows.
Workflows are TypeScript functions compiled to WASM via Bun, executed by Chainlink DON nodes.

## SDK: @chainlink/cre-sdk (v1.0.7+)
- Import: import { cre, type Runtime, type NodeRuntime } from "@chainlink/cre-sdk"
- Workflows use cre.handler() to define trigger → compute → action pipelines
- Supports HTTP triggers, cron triggers, and on-chain event triggers

## Key Patterns

### Workflow Structure
\`\`\`typescript
import { cre, type Runtime, type NodeRuntime } from "@chainlink/cre-sdk"

type Config = { apiUrl: string }
type HTTPPayload = { body: string; headers: Record<string, string> }

const handler = (runtime: Runtime<Config>, payload: HTTPPayload) => {
  // Node mode for side effects (HTTP calls, AI, etc.)
  const result = runtime.runInNodeMode((nodeRuntime: NodeRuntime<Config>) => {
    const response = nodeRuntime.httpClient.sendRequest({
      url: "https://api.example.com/data",
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
    return JSON.parse(response.body)
  })

  // Write on-chain
  runtime.evmClient.writeReport({
    chainId: 84532, // Base Sepolia
    contractAddress: "0x...",
    functionSignature: "storeData(bytes32,uint256)",
    params: [result.id, result.value],
  })
}

const initWorkflow = (config: Config) => {
  const http = new cre.capabilities.HTTPTrigger()
  return [cre.handler(http.trigger({ method: "POST" }), handler)]
}

export default initWorkflow
\`\`\`

### HTTP Client (in Node Mode)
- nodeRuntime.httpClient.sendRequest({ url, method, headers, body })
- Returns { statusCode, body, headers }
- Used for external API calls (AI, databases, etc.)

### EVM Client (Write On-Chain)
- runtime.evmClient.writeReport({ chainId, contractAddress, functionSignature, params })
- Writes results to smart contracts via Chainlink DON consensus
- Results are cryptographically attested

### Secrets Management
- cre secrets set KEY "value"
- Accessed via config object in workflow
- Stored encrypted, only available to DON nodes

### Compilation & Deployment
- Compile: bun x cre-compile src/workflows/name/index.ts dist/name.wasm
- Deploy: cre workflow deploy dist/name.wasm
- Secrets: cre secrets set KEY "value"

## CRE Project Structure
\`\`\`
cre/
├── project.yaml          # Project config
├── secrets.yaml          # Secret references
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
└── src/
    └── workflows/
        └── workflow-name/
            ├── index.ts  # Main workflow (exported initWorkflow)
            └── helpers.ts # Helper functions
\`\`\`

## iStory Integration Context
- Using CRE to verify AI-extracted story metrics (significance, emotional depth, quality)
- Flow: Story saved → CRE triggered → AI analysis via Gemini → results stored on-chain
- Contract: VerifiedMetrics.sol on Base Sepolia (chain ID 84532)
- Buyer protection: Paywalled content has verifiable quality metrics
`;

async function creAgent(question: string): Promise<string> {
  const systemPrompt = `You are a Chainlink CRE (Compute Runtime Environment) specialist.
You help developers build CRE workflows, debug issues, and design architectures.

${CRE_KNOWLEDGE_BASE}

When answering:
1. Always use the REAL CRE SDK patterns (TypeScript, not YAML)
2. Reference specific SDK functions and types
3. Consider security implications (secret management, attestation)
4. Provide working code examples when applicable
5. Note any limitations or gotchas`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 16000,
    thinking: {
      type: "enabled",
      budget_tokens: 10000,
    },
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: question,
      },
    ],
  });

  let thinking = "";
  let answer = "";

  for (const block of response.content) {
    if (block.type === "thinking") {
      thinking = block.thinking;
    } else if (block.type === "text") {
      answer = block.text;
    }
  }

  return `
## CRE Agent Thinking
${thinking}

## Answer
${answer}
`;
}

// CLI usage
const question = process.argv[2];
if (!question) {
  console.error("Usage: npx ts-node scripts/cre-agent.ts 'your CRE question'");
  console.error("Example: npx ts-node scripts/cre-agent.ts 'How do I write on-chain from a CRE workflow?'");
  process.exit(1);
}

creAgent(question).then(console.log).catch(console.error);
