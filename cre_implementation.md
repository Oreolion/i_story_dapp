# iStory Chainlink CRE Integration — Implementation Prompt

> **For:** Chainlink Hackathon Submission
> **Feature:** Verified Story Metrics for Buyer Protection
> **Architecture:** Additive layer on existing iStory app
> **Core App Changes:** Minimal (~5% of codebase)

---

## 🤖 FIRST: Create CRE Sub-Agent & Reusable Skills

Before implementing the iStory-specific features, Claude Code MUST create reusable CRE tools that can be used across ANY project. This includes:

1. **CRE Sub-Agent** — A specialized agent for CRE-related problem solving
2. **CRE Skills Folder** — Reusable knowledge base for CRE development

### Task 0.1: Create CRE Sub-Agent

<task id="CRE.0.1">
<objective>Create a Claude SDK-powered sub-agent specialized in Chainlink CRE</objective>
<priority>FIRST — Do this before any other CRE work</priority>

<file_to_create>
scripts/cre-agent.ts
</file_to_create>

<content>
```typescript
// scripts/cre-agent.ts
// CRE-specialized sub-agent using Claude SDK with extended thinking
// Usage: npx ts-node scripts/cre-agent.ts "your CRE question or problem"

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// CRE Knowledge Base - Core concepts the agent knows
const CRE_KNOWLEDGE = `
# Chainlink CRE (Compute Runtime Environment) Knowledge Base

## What is CRE?
CRE is Chainlink's verifiable compute platform that allows:
- Off-chain computation with on-chain verification
- Cryptographic attestation of compute results
- Trustless execution of complex logic (including AI/ML)
- Secure external API calls with proof of execution

## Core Components

### 1. Workflows
- Defined in YAML or via SDK
- Specify trigger, steps, and output
- Can include HTTP requests, compute functions, EVM transactions
- Support secrets management

### 2. Compute Functions
- TypeScript/JavaScript functions that run in CRE
- Have access to external APIs (logged and verifiable)
- Output is cryptographically attested
- Cannot be tampered with by workflow creator

### 3. Attestations
- Cryptographic proof that computation ran correctly
- Includes: input hash, output hash, timestamp, CRE signature
- Verifiable on-chain via CRE contracts
- Unique attestation ID for each execution

### 4. EVM Integration
- CRE can call smart contracts with verified results
- Contracts can verify CRE attestations
- Supports Base, Ethereum, Arbitrum, and other EVM chains

## Common Patterns

### Pattern 1: Verified AI Analysis
\`\`\`
Trigger → Fetch Data → AI Compute → Attest → Store On-Chain
\`\`\`

### Pattern 2: Cross-Chain Bridge
\`\`\`
Source Chain Event → CRE Validates → Target Chain Action
\`\`\`

### Pattern 3: Oracle Enhancement
\`\`\`
Data Request → CRE Aggregates/Validates → Verified Response
\`\`\`

### Pattern 4: Automated Rewards
\`\`\`
User Action → CRE Computes Eligibility → Verified Distribution
\`\`\`

## Best Practices

1. MINIMIZE COMPUTE COST
   - Keep functions focused and small
   - Cache repeated external calls
   - Use efficient data structures

2. HANDLE ERRORS GRACEFULLY
   - Always wrap external calls in try/catch
   - Define fallback values
   - Log errors for debugging

3. SECURE SECRETS
   - Never hardcode API keys
   - Use CRE secrets management
   - Rotate secrets regularly

4. OPTIMIZE FOR VERIFICATION
   - Keep attestation payload small
   - Use deterministic computations where possible
   - Document what's being verified

5. SMART CONTRACT INTEGRATION
   - Verify attestation before trusting data
   - Use events for indexing
   - Plan for CRE forwarder address changes

## Common Errors & Solutions

ERROR: "Attestation verification failed"
→ Check CRE forwarder address is correct
→ Verify attestation data matches expected format
→ Ensure contract is on correct network

ERROR: "Workflow timeout"
→ External API may be slow
→ Add retry logic with backoff
→ Increase timeout in workflow config

ERROR: "Secrets not found"
→ Ensure secrets are set: cre secrets set KEY value
→ Check secret name matches exactly (case-sensitive)
→ Verify you're in correct CRE project

ERROR: "Invalid workflow YAML"
→ Validate YAML syntax
→ Check all required fields present
→ Ensure step references are correct
`;

interface CREAgentRequest {
  question: string;
  context?: string;
  projectType?: string;
  currentCode?: string;
  errorMessage?: string;
}

interface CREAgentResponse {
  thinking: string;
  answer: string;
  codeExamples?: string[];
  recommendations?: string[];
  warnings?: string[];
}

async function askCREAgent(request: CREAgentRequest): Promise<CREAgentResponse> {
  const systemPrompt = `You are a Chainlink CRE expert assistant. Your role is to help developers:
- Design CRE workflows for their use cases
- Debug CRE-related issues
- Write CRE compute functions
- Integrate CRE with smart contracts
- Optimize CRE implementations

You have deep knowledge of:
${CRE_KNOWLEDGE}

When answering:
1. Think through the problem step by step
2. Provide concrete code examples when relevant
3. Warn about common pitfalls
4. Suggest best practices
5. Be specific to their use case

Always prioritize:
- Security (attestation verification, secrets management)
- Performance (minimize compute costs)
- Reliability (error handling, retries)
- Maintainability (clear code, good documentation)`;

  const userPrompt = `
## Question
${request.question}

${request.context ? `## Context\n${request.context}` : ""}

${request.projectType ? `## Project Type\n${request.projectType}` : ""}

${request.currentCode ? `## Current Code\n\`\`\`\n${request.currentCode}\n\`\`\`` : ""}

${request.errorMessage ? `## Error Message\n${request.errorMessage}` : ""}

Please provide a detailed answer with code examples if applicable.
`;

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
        content: userPrompt,
      },
    ],
  });

  // Extract thinking and response
  let thinking = "";
  let answer = "";

  for (const block of response.content) {
    if (block.type === "thinking") {
      thinking = block.thinking;
    } else if (block.type === "text") {
      answer = block.text;
    }
  }

  // Parse recommendations and warnings from answer
  const codeExamples = answer.match(/```[\s\S]*?```/g) || [];
  const recommendations = answer.match(/(?:Recommend|Best practice|Tip):.*$/gm) || [];
  const warnings = answer.match(/(?:Warning|Caution|Note|Important):.*$/gm) || [];

  return {
    thinking,
    answer,
    codeExamples,
    recommendations,
    warnings,
  };
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
CRE Agent - Chainlink CRE Expert Assistant

Usage:
  npx ts-node scripts/cre-agent.ts "your question"
  
Options:
  --context "additional context"
  --project "project type (e.g., defi, nft, gaming)"
  --code "path to code file"
  --error "error message to debug"

Examples:
  npx ts-node scripts/cre-agent.ts "How do I verify CRE attestations in Solidity?"
  
  npx ts-node scripts/cre-agent.ts "My workflow times out" --error "Timeout after 30s"
  
  npx ts-node scripts/cre-agent.ts "Design a CRE workflow for NFT metadata verification" --project "nft"
`);
    process.exit(0);
  }

  const question = args[0];
  
  // Parse optional flags
  const contextIndex = args.indexOf("--context");
  const projectIndex = args.indexOf("--project");
  const errorIndex = args.indexOf("--error");
  
  const request: CREAgentRequest = {
    question,
    context: contextIndex !== -1 ? args[contextIndex + 1] : undefined,
    projectType: projectIndex !== -1 ? args[projectIndex + 1] : undefined,
    errorMessage: errorIndex !== -1 ? args[errorIndex + 1] : undefined,
  };

  console.log("🤖 CRE Agent thinking...\n");

  try {
    const response = await askCREAgent(request);

    console.log("═══════════════════════════════════════════════════════════");
    console.log("THINKING PROCESS:");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(response.thinking);
    
    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("ANSWER:");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(response.answer);

    if (response.warnings && response.warnings.length > 0) {
      console.log("\n⚠️  WARNINGS:");
      response.warnings.forEach((w) => console.log(`   ${w}`));
    }

  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// Export for programmatic use
export { askCREAgent, CREAgentRequest, CREAgentResponse };

// Run CLI
main();
```
</content>

<usage_examples>
```bash
# Basic question
npx ts-node scripts/cre-agent.ts "How do I create a CRE workflow for AI content verification?"

# Debugging
npx ts-node scripts/cre-agent.ts "Why is my attestation failing?" --error "Attestation verification failed on contract"

# Project-specific
npx ts-node scripts/cre-agent.ts "Design rewards verification for my app" --project "content-platform" --context "Users earn tokens for creating content, need to verify quality"

# Architecture question
npx ts-node scripts/cre-agent.ts "Should I use CRE or Chainlink Functions for price feeds?"
```
</usage_examples>

<acceptance_criteria>
- [ ] Script compiles without errors
- [ ] Can answer basic CRE questions
- [ ] Provides code examples
- [ ] Uses extended thinking for complex problems
- [ ] CLI interface works
</acceptance_criteria>
</task>

---

### Task 0.2: Create CRE Skills Folder

<task id="CRE.0.2">
<objective>Create reusable CRE skills that can be used across ANY project</objective>

<folder_structure>
```
skills/
└── cre/
    ├── SKILL.md                    # Main skill documentation
    ├── templates/
    │   ├── workflow-basic.yaml     # Basic workflow template
    │   ├── workflow-ai.yaml        # AI analysis workflow template
    │   ├── workflow-oracle.yaml    # Oracle pattern template
    │   └── contract-verifier.sol   # Contract verification template
    ├── functions/
    │   ├── base-function.ts        # Base compute function template
    │   ├── ai-analysis.ts          # AI analysis template
    │   └── data-validation.ts      # Data validation template
    └── examples/
        ├── content-verification/   # Content platform example
        ├── defi-automation/        # DeFi example
        └── nft-metadata/           # NFT example
```
</folder_structure>

<file_to_create>
skills/cre/SKILL.md
</file_to_create>

<content>
```markdown
# Chainlink CRE Skill

> Reusable patterns, templates, and best practices for Chainlink CRE development

## When to Use This Skill

Use this skill when:
- Building verifiable off-chain computation
- Integrating AI/ML with blockchain
- Creating trustless automation
- Verifying external data on-chain
- Building cross-chain applications

## Quick Start

### 1. Choose Your Pattern

| Pattern | Use Case | Template |
|---------|----------|----------|
| AI Verification | Verify AI outputs on-chain | `templates/workflow-ai.yaml` |
| Data Oracle | Fetch and verify external data | `templates/workflow-oracle.yaml` |
| Basic Compute | Simple verifiable computation | `templates/workflow-basic.yaml` |

### 2. Copy Template

\`\`\`bash
# Copy the template you need
cp skills/cre/templates/workflow-ai.yaml cre/workflows/my-workflow.yaml
\`\`\`

### 3. Customize

Edit the template with your:
- Trigger configuration
- Input/output schemas
- Compute function logic
- Smart contract addresses

### 4. Deploy

\`\`\`bash
cre workflows deploy cre/workflows/my-workflow.yaml
\`\`\`

## Templates

### Basic Workflow (workflow-basic.yaml)
Simple pattern for verifiable computation.

### AI Analysis Workflow (workflow-ai.yaml)
Pattern for running AI models with verified output.

### Oracle Workflow (workflow-oracle.yaml)
Pattern for fetching and verifying external data.

### Verification Contract (contract-verifier.sol)
Solidity contract for verifying CRE attestations.

## Best Practices

### Security
1. Always verify attestations on-chain
2. Use CRE secrets for API keys
3. Validate all inputs
4. Handle errors gracefully

### Performance
1. Minimize external API calls
2. Cache when possible
3. Keep payloads small
4. Use efficient data structures

### Reliability
1. Implement retry logic
2. Set appropriate timeouts
3. Log errors for debugging
4. Test edge cases

## Common Use Cases

### 1. Content Verification
Verify content quality, authenticity, or metrics before on-chain actions.

### 2. Automated Rewards
Calculate and distribute rewards based on verified criteria.

### 3. Cross-Chain Messaging
Verify messages between chains with CRE attestation.

### 4. AI Oracle
Run AI inference with verifiable results.

### 5. Data Aggregation
Aggregate and verify data from multiple sources.

## Troubleshooting

### "Attestation verification failed"
- Check CRE forwarder address
- Verify contract is on correct network
- Ensure attestation format matches

### "Workflow timeout"
- Increase timeout in config
- Add retry logic
- Check external API latency

### "Secrets not found"
- Verify secret name (case-sensitive)
- Ensure you're in correct project
- Re-set secrets if needed

## Need Help?

Use the CRE Agent:
\`\`\`bash
npx ts-node scripts/cre-agent.ts "your question"
\`\`\`

## Resources

- [Chainlink CRE Docs](https://docs.chain.link/cre)
- [CRE API Reference](https://docs.chain.link/cre/api)
- [Example Repositories](https://github.com/smartcontractkit/cre-examples)
```
</content>

<file_to_create>
skills/cre/templates/workflow-ai.yaml
</file_to_create>

<content>
```yaml
# AI Analysis Workflow Template
# Use this for: Content verification, quality scoring, classification, etc.

name: ai-analysis-workflow
version: "1.0"
description: "Template for AI analysis with verified output"

# CUSTOMIZE: Your trigger configuration
trigger:
  type: http
  method: POST
  authentication:
    type: api_key
    header: X-CRE-API-Key

# CUSTOMIZE: Your input schema
input:
  type: object
  required:
    - contentId
    - contentUrl
  properties:
    contentId:
      type: string
      description: "Unique identifier for the content"
    contentUrl:
      type: string
      description: "URL to fetch content from"
    callbackUrl:
      type: string
      description: "Webhook URL for completion notification"
    # ADD MORE FIELDS AS NEEDED

steps:
  # Step 1: Fetch content
  - name: fetch_content
    type: http_request
    config:
      method: GET
      url: "{{ input.contentUrl }}"
      headers:
        Authorization: "Bearer {{ secrets.CONTENT_API_KEY }}"
    output: content_data

  # Step 2: AI Analysis (CUSTOMIZE THIS)
  - name: ai_analysis
    type: compute
    function: analyzeContent  # Your function name
    input:
      content: "{{ steps.fetch_content.output.body }}"
      # ADD MORE INPUTS AS NEEDED
    output: analysis_result

  # Step 3: Store on-chain (CUSTOMIZE CONTRACT AND METHOD)
  - name: store_onchain
    type: evm_transaction
    config:
      chain: base-sepolia  # CHANGE TO YOUR CHAIN
      contract: "{{ secrets.VERIFICATION_CONTRACT }}"
      method: storeVerifiedResult  # YOUR METHOD NAME
      params:
        - "{{ input.contentId }}"
        - "{{ steps.ai_analysis.output.score }}"
        - "{{ steps.ai_analysis.output.metadata }}"
    output: tx_result

  # Step 4: Notify callback
  - name: notify
    type: http_request
    config:
      method: POST
      url: "{{ input.callbackUrl }}"
      headers:
        X-Webhook-Secret: "{{ secrets.WEBHOOK_SECRET }}"
      body:
        contentId: "{{ input.contentId }}"
        attestationId: "{{ workflow.attestation_id }}"
        txHash: "{{ steps.store_onchain.output.txHash }}"
        result: "{{ steps.ai_analysis.output }}"

output:
  attestationId: "{{ workflow.attestation_id }}"
  txHash: "{{ steps.store_onchain.output.txHash }}"
  result: "{{ steps.ai_analysis.output }}"
```
</content>

<file_to_create>
skills/cre/templates/contract-verifier.sol
</file_to_create>

<content>
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CREVerifiedStorage
 * @notice Template contract for storing CRE-verified data
 * @dev Customize this for your specific use case
 */
contract CREVerifiedStorage is Ownable {
    
    // ============ CUSTOMIZE: Your data structure ============
    
    struct VerifiedData {
        uint256 score;           // Example: quality score
        bytes32 metadataHash;    // Example: hash of metadata
        uint256 verifiedAt;
        bytes32 attestationId;
        bool exists;
    }
    
    // ============ State ============
    
    // contentId => VerifiedData
    mapping(bytes32 => VerifiedData) public verifiedData;
    
    // Authorized CRE forwarder
    address public creForwarder;
    
    // Stats
    uint256 public totalVerified;
    
    // ============ Events ============
    
    event DataVerified(
        bytes32 indexed contentId,
        uint256 score,
        bytes32 attestationId,
        uint256 timestamp
    );
    
    event CREForwarderUpdated(address indexed oldForwarder, address indexed newForwarder);
    
    // ============ Modifiers ============
    
    modifier onlyCRE() {
        require(msg.sender == creForwarder, "Only CRE forwarder");
        _;
    }
    
    // ============ Constructor ============
    
    constructor(address _creForwarder) Ownable(msg.sender) {
        creForwarder = _creForwarder;
    }
    
    // ============ CRE Functions (CUSTOMIZE) ============
    
    /**
     * @notice Store verified result from CRE
     * @dev CUSTOMIZE: Add your parameters
     */
    function storeVerifiedResult(
        bytes32 contentId,
        uint256 score,
        bytes32 metadataHash,
        bytes32 attestationId
    ) external onlyCRE {
        require(!verifiedData[contentId].exists, "Already verified");
        
        verifiedData[contentId] = VerifiedData({
            score: score,
            metadataHash: metadataHash,
            verifiedAt: block.timestamp,
            attestationId: attestationId,
            exists: true
        });
        
        totalVerified++;
        
        emit DataVerified(contentId, score, attestationId, block.timestamp);
    }
    
    // ============ View Functions ============
    
    function getData(bytes32 contentId) external view returns (
        uint256 score,
        bytes32 metadataHash,
        uint256 verifiedAt,
        bytes32 attestationId,
        bool exists
    ) {
        VerifiedData storage d = verifiedData[contentId];
        return (d.score, d.metadataHash, d.verifiedAt, d.attestationId, d.exists);
    }
    
    function isVerified(bytes32 contentId) external view returns (bool) {
        return verifiedData[contentId].exists;
    }
    
    // ============ Admin ============
    
    function setCREForwarder(address _newForwarder) external onlyOwner {
        require(_newForwarder != address(0), "Invalid address");
        address old = creForwarder;
        creForwarder = _newForwarder;
        emit CREForwarderUpdated(old, _newForwarder);
    }
}
```
</content>

<file_to_create>
skills/cre/functions/ai-analysis.ts
</file_to_create>

<content>
```typescript
// Template: AI Analysis Function for CRE
// Customize this for your specific AI analysis needs

import { CREFunction, CREContext } from "@chainlink/cre-sdk";

// CUSTOMIZE: Your input type
interface AnalysisInput {
  content: string;
  contentType?: string;
  options?: {
    detailed?: boolean;
    threshold?: number;
  };
}

// CUSTOMIZE: Your output type
interface AnalysisOutput {
  score: number;              // 0-100
  category: string;
  confidence: number;         // 0-1
  metadata: Record<string, unknown>;
  timestamp: number;
}

export const analyzeContent: CREFunction<AnalysisInput, AnalysisOutput> = async (
  input: AnalysisInput,
  context: CREContext
): Promise<AnalysisOutput> => {
  
  const { content, contentType = "text", options = {} } = input;
  
  // Validate input
  if (!content || content.length < 10) {
    throw new Error("Content too short for analysis");
  }
  
  // CUSTOMIZE: Your AI analysis logic
  const aiResult = await callAI(content, contentType, context);
  
  // Normalize and validate output
  const score = clamp(Math.round(aiResult.score * 100), 0, 100);
  const confidence = clamp(aiResult.confidence, 0, 1);
  
  return {
    score,
    category: aiResult.category,
    confidence,
    metadata: {
      wordCount: content.split(/\s+/).length,
      contentType,
      ...aiResult.metadata,
    },
    timestamp: Date.now(),
  };
};

// CUSTOMIZE: Your AI API call
async function callAI(
  content: string,
  contentType: string,
  context: CREContext
): Promise<{
  score: number;
  category: string;
  confidence: number;
  metadata: Record<string, unknown>;
}> {
  // Example using Gemini (replace with your AI provider)
  const API_KEY = context.secrets.AI_API_KEY;
  const API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";
  
  const prompt = `
Analyze this ${contentType} content and provide:
1. Quality score (0-1)
2. Category
3. Confidence (0-1)

Content:
${content.slice(0, 5000)}

Respond ONLY with JSON:
{
  "score": <0-1>,
  "category": "<category>",
  "confidence": <0-1>,
  "metadata": {}
}
`;

  const response = await fetch(`${API_URL}?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 500 },
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error("Empty AI response");
  }

  // Parse JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Invalid AI response format");
  }

  return JSON.parse(jsonMatch[0]);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export default analyzeContent;
```
</content>

<acceptance_criteria>
- [ ] Skills folder structure created
- [ ] SKILL.md provides clear guidance
- [ ] Templates are copy-paste ready
- [ ] Contract template compiles
- [ ] Function template is type-safe
- [ ] Examples are practical
</acceptance_criteria>
</task>

---

### Task 0.3: Register CRE Skill for Claude Code

<task id="CRE.0.3">
<objective>Make the CRE skill discoverable by Claude Code</objective>

<instructions>
After creating the skills folder, add it to your project's skill registry.

If using a CLAUDE.md or similar config:
```markdown
## Available Skills

### CRE (Chainlink Compute Runtime Environment)
Location: /skills/cre/SKILL.md
Use for: Verifiable off-chain computation, AI verification, blockchain integration
```

If using a skills index:
```json
{
  "skills": [
    {
      "name": "cre",
      "description": "Chainlink CRE development patterns and templates",
      "path": "/skills/cre/SKILL.md",
      "triggers": [
        "chainlink", "cre", "verifiable compute", "attestation",
        "verified ai", "trustless", "off-chain verification"
      ]
    }
  ]
}
```
</instructions>

<acceptance_criteria>
- [ ] CRE skill is discoverable
- [ ] Can be referenced in future prompts
- [ ] Templates are accessible
</acceptance_criteria>
</task>

---

### Using the CRE Agent and Skills

From this point forward, Claude Code should:

1. **Consult the CRE Agent** when stuck on CRE-related problems:
```bash
npx ts-node scripts/cre-agent.ts "How do I handle CRE timeout errors?"
```

2. **Reference CRE Skills** before implementing:
```bash
# Read the skill first
cat skills/cre/SKILL.md

# Copy templates as starting point
cp skills/cre/templates/workflow-ai.yaml cre/workflows/
cp skills/cre/templates/contract-verifier.sol contracts/
```

3. **Create project-specific implementations** based on templates

---

## 🎯 What We're Building

### The Problem
```
Buyer sees a paywalled story:
"The Day Everything Changed - 50 $STORY to unlock"
"Themes: growth, identity | Significance: High"

Buyer thinks: "Did the creator fake these metrics to get sales?"

TRUST GAP: Buyers can't verify quality before purchasing
```

### The Solution
```
Chainlink CRE verifies story metrics in a trusted environment:
- AI analysis runs in CRE (not creator's control)
- Metrics are cryptographically attested
- Proof stored on-chain
- Buyers see "✓ Verified" badge they can trust

RESULT: Creators can't fake scores. Buyers purchase with confidence.
```

---

## 📚 Pre-Implementation: Understand CRE

Before coding, you MUST understand Chainlink CRE fundamentals.

### Required Reading
```
□ CRE Overview: https://docs.chain.link/cre
□ CRE Quickstart: https://docs.chain.link/cre/getting-started
□ CRE Workflows: https://docs.chain.link/cre/workflows
□ CRE + EVM: https://docs.chain.link/cre/evm-integration
```

### Key CRE Concepts
```
WORKFLOW:
- A defined sequence of steps that CRE executes
- Written in YAML or via SDK
- Triggered by HTTP, schedule, or on-chain events

COMPUTE FUNCTION:
- Your custom code that runs inside CRE
- Has access to external APIs (like AI)
- Output is cryptographically attested

ATTESTATION:
- Cryptographic proof that computation ran correctly
- Verifiable on-chain
- Cannot be faked or tampered with

CALLBACK:
- CRE calls your smart contract with results + proof
- Contract verifies the attestation
- Then executes logic (store metrics, etc.)
```

---

## 🏗️ Architecture Overview

### What STAYS THE SAME (Zero Changes)

```
┌─────────────────────────────────────────────────────────────────┐
│  UNCHANGED COMPONENTS                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frontend:                                                      │
│  ├── Voice recording UI                                         │
│  ├── Story display                                              │
│  ├── Story creation flow                                        │
│  ├── NFT minting UI                                             │
│  ├── Tipping UI                                                 │
│  ├── Profile pages                                              │
│  └── Social feed                                                │
│                                                                 │
│  Backend:                                                       │
│  ├── /api/journal/transcribe                                    │
│  ├── /api/ai/enhance                                            │
│  ├── /api/ai/analyze (still runs for immediate UI display)      │
│  ├── /api/stories/*                                             │
│  ├── /api/nft/*                                                 │
│  └── All other existing endpoints                               │
│                                                                 │
│  Database:                                                      │
│  ├── stories table                                              │
│  ├── story_metadata table                                       │
│  ├── users table                                                │
│  └── All existing tables                                        │
│                                                                 │
│  Blockchain:                                                    │
│  ├── $STORY Token (ERC20)                                       │
│  ├── Story NFT (ERC721)                                         │
│  ├── Tipping contract                                           │
│  └── Paywall payment contract                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### What's ADDED (New Components)

```
┌─────────────────────────────────────────────────────────────────┐
│  NEW: CHAINLINK CRE LAYER                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CRE Workflow:                                                  │
│  ├── cre/workflows/story-verification.yaml                      │
│  └── cre/functions/analyzeStory.ts                              │
│                                                                 │
│  Backend (New Endpoints):                                       │
│  ├── /api/cre/trigger — Triggers CRE workflow                   │
│  └── /api/cre/webhook — Receives CRE completion events          │
│                                                                 │
│  Smart Contracts (New):                                         │
│  └── VerifiedMetrics.sol — Stores verified metrics on-chain     │
│                                                                 │
│  Frontend (New Components):                                     │
│  ├── VerifiedBadge.tsx — Shows "✓ Verified" indicator           │
│  ├── VerifiedMetricsCard.tsx — Displays verified metrics        │
│  └── ProofViewer.tsx — Shows on-chain proof details             │
│                                                                 │
│  Database (New Table):                                          │
│  └── verified_metrics — Caches CRE results for quick lookup     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Diagram

```
USER CREATES STORY
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  EXISTING FLOW (runs immediately, unchanged)                     │
│                                                                  │
│  Record → Transcribe → Enhance → Save to Supabase                │
│                           │                                      │
│                           ▼                                      │
│                 Gemini extracts metadata                         │
│                 (themes, emotions, significance)                 │
│                           │                                      │
│                           ▼                                      │
│                 UI shows insights immediately                    │
│                 (unverified, for creator's use)                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
       │
       │ (async, background)
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  NEW: CRE VERIFICATION FLOW                                      │
│                                                                  │
│  Backend triggers CRE workflow                                   │
│       │                                                          │
│       ▼                                                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  CHAINLINK CRE ENVIRONMENT                                 │ │
│  │                                                            │ │
│  │  1. Fetch story content (from Supabase or IPFS)            │ │
│  │  2. Run AI analysis:                                       │ │
│  │     - Significance score (0-100)                           │ │
│  │     - Emotional depth (1-5)                                │ │
│  │     - Content quality (0-100)                              │ │
│  │     - Word count                                           │ │
│  │     - Theme extraction                                     │ │
│  │  3. Generate attestation (cryptographic proof)             │ │
│  │  4. Call smart contract with results + proof               │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│       │                                                          │
│       ▼                                                          │
│  Smart contract verifies attestation                             │
│       │                                                          │
│       ▼                                                          │
│  Verified metrics stored on-chain                                │
│       │                                                          │
│       ▼                                                          │
│  Backend caches in Supabase (for fast reads)                     │
│       │                                                          │
│       ▼                                                          │
│  Frontend shows "✓ Verified" badge                               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
       │
       ▼
BUYER VIEWS PAYWALLED STORY
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  BUYER EXPERIENCE                                                │
│                                                                  │
│  Sees: "The Day Everything Changed"                              │
│        "50 $STORY to unlock"                                     │
│                                                                  │
│        ✓ Verified Story Metrics                                  │
│        ┌─────────────────────────────────┐                       │
│        │ Significance:    87/100        │                       │
│        │ Emotional Depth: 4/5           │                       │
│        │ Word Count:      1,247         │                       │
│        │ Themes: growth, identity ✓     │                       │
│        │                                │                       │
│        │ Verified by Chainlink CRE      │                       │
│        │ [View On-Chain Proof ↗]        │                       │
│        └─────────────────────────────────┘                       │
│                                                                  │
│  Buyer thinks: "Verified metrics. Worth the price."              │
│  Buyer clicks: [Pay to Unlock]                                   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📋 Implementation Tasks

### Task 0: Environment Setup

<task id="CRE.0">
<objective>Set up CRE development environment</objective>

<steps>
1. Install Chainlink CRE CLI:
```bash
npm install -g @chainlink/cre-cli
```

2. Authenticate with Chainlink:
```bash
cre auth login
```

3. Initialize CRE in your project:
```bash
mkdir cre
cd cre
cre init
```

4. Install CRE SDK in your Next.js project:
```bash
npm install @chainlink/cre-sdk
```

5. Add environment variables to `.env.local`:
```env
# Chainlink CRE
CRE_API_KEY=your_cre_api_key
CRE_WORKFLOW_ID=will_be_set_after_deployment
CRE_WEBHOOK_SECRET=generate_a_random_secret

# Existing (should already have)
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
```

6. Verify setup:
```bash
cre whoami
cre workflows list
```
</steps>

<acceptance_criteria>
- [ ] CRE CLI installed and authenticated
- [ ] CRE SDK installed in project
- [ ] Environment variables configured
- [ ] Can run `cre workflows list` without errors
</acceptance_criteria>
</task>

---

### Task 1: Database Schema Update

<task id="CRE.1">
<objective>Add table to cache verified metrics</objective>

<file>
Supabase SQL Editor (run this migration)
</file>

<sql>
```sql
-- Create verified_metrics table
CREATE TABLE IF NOT EXISTS verified_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  
  -- Verified scores (from CRE)
  significance_score INTEGER NOT NULL CHECK (significance_score >= 0 AND significance_score <= 100),
  emotional_depth INTEGER NOT NULL CHECK (emotional_depth >= 1 AND emotional_depth <= 5),
  quality_score INTEGER NOT NULL CHECK (quality_score >= 0 AND quality_score <= 100),
  word_count INTEGER NOT NULL,
  verified_themes TEXT[] NOT NULL DEFAULT '{}',
  
  -- CRE proof data
  cre_attestation_id TEXT NOT NULL UNIQUE,
  cre_workflow_run_id TEXT NOT NULL,
  on_chain_tx_hash TEXT,
  on_chain_block_number BIGINT,
  
  -- Timestamps
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(story_id)
);

-- Index for fast lookups
CREATE INDEX idx_verified_metrics_story_id ON verified_metrics(story_id);
CREATE INDEX idx_verified_metrics_attestation ON verified_metrics(cre_attestation_id);

-- RLS Policies
ALTER TABLE verified_metrics ENABLE ROW LEVEL SECURITY;

-- Anyone can read verified metrics (they're public proof)
CREATE POLICY "Verified metrics are publicly readable"
  ON verified_metrics FOR SELECT
  USING (true);

-- Only service role can insert/update (from CRE webhook)
CREATE POLICY "Only service role can insert verified metrics"
  ON verified_metrics FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Only service role can update verified metrics"
  ON verified_metrics FOR UPDATE
  USING (auth.role() = 'service_role');
```
</sql>

<acceptance_criteria>
- [ ] Table created successfully
- [ ] Indexes created
- [ ] RLS policies applied
- [ ] Can query table from application
</acceptance_criteria>
</task>

---

### Task 2: CRE Workflow Definition

<task id="CRE.2">
<objective>Define the CRE workflow for story verification</objective>

<file_to_create>
cre/workflows/story-verification.yaml
</file_to_create>

<content>
```yaml
# cre/workflows/story-verification.yaml
name: istory-verification
version: "1.0"
description: "Verifies story content metrics using AI analysis"

# Trigger: HTTP request from iStory backend
trigger:
  type: http
  method: POST
  authentication:
    type: api_key
    header: X-CRE-API-Key

# Input schema
input:
  type: object
  required:
    - storyId
    - contentUrl
    - authorWallet
  properties:
    storyId:
      type: string
      description: "UUID of the story"
    contentUrl:
      type: string
      description: "URL to fetch story content (Supabase or IPFS)"
    authorWallet:
      type: string
      description: "Author's wallet address"
    callbackUrl:
      type: string
      description: "Webhook URL for completion notification"

# Workflow steps
steps:
  # Step 1: Fetch story content
  - name: fetch_content
    type: http_request
    config:
      method: GET
      url: "{{ input.contentUrl }}"
      headers:
        Authorization: "Bearer {{ secrets.SUPABASE_SERVICE_KEY }}"
    output: story_content

  # Step 2: Run AI analysis
  - name: analyze_content
    type: compute
    function: analyzeStory
    input:
      content: "{{ steps.fetch_content.output.body.content }}"
      title: "{{ steps.fetch_content.output.body.title }}"
    output: analysis_result

  # Step 3: Store on-chain
  - name: store_onchain
    type: evm_transaction
    config:
      chain: base-sepolia
      contract: "{{ secrets.VERIFIED_METRICS_CONTRACT }}"
      method: storeVerifiedMetrics
      params:
        - "{{ input.storyId }}"
        - "{{ input.authorWallet }}"
        - "{{ steps.analyze_content.output.significanceScore }}"
        - "{{ steps.analyze_content.output.emotionalDepth }}"
        - "{{ steps.analyze_content.output.qualityScore }}"
        - "{{ steps.analyze_content.output.wordCount }}"
        - "{{ steps.analyze_content.output.themes }}"
    output: tx_result

  # Step 4: Notify backend
  - name: notify_backend
    type: http_request
    config:
      method: POST
      url: "{{ input.callbackUrl }}"
      headers:
        X-CRE-Webhook-Secret: "{{ secrets.WEBHOOK_SECRET }}"
      body:
        storyId: "{{ input.storyId }}"
        attestationId: "{{ workflow.attestation_id }}"
        workflowRunId: "{{ workflow.run_id }}"
        txHash: "{{ steps.store_onchain.output.txHash }}"
        blockNumber: "{{ steps.store_onchain.output.blockNumber }}"
        metrics:
          significanceScore: "{{ steps.analyze_content.output.significanceScore }}"
          emotionalDepth: "{{ steps.analyze_content.output.emotionalDepth }}"
          qualityScore: "{{ steps.analyze_content.output.qualityScore }}"
          wordCount: "{{ steps.analyze_content.output.wordCount }}"
          themes: "{{ steps.analyze_content.output.themes }}"

# Output
output:
  attestationId: "{{ workflow.attestation_id }}"
  txHash: "{{ steps.store_onchain.output.txHash }}"
  metrics: "{{ steps.analyze_content.output }}"
```
</content>

<acceptance_criteria>
- [ ] YAML is valid
- [ ] All steps are properly defined
- [ ] Input/output schemas are correct
- [ ] References to secrets are correct
</acceptance_criteria>
</task>

---

### Task 3: CRE Compute Function

<task id="CRE.3">
<objective>Create the AI analysis function that runs inside CRE</objective>

<file_to_create>
cre/functions/analyzeStory.ts
</file_to_create>

<content>
```typescript
// cre/functions/analyzeStory.ts
// This function runs inside Chainlink CRE's verifiable compute environment

import { CREFunction, CREContext } from "@chainlink/cre-sdk";

interface AnalysisInput {
  content: string;
  title: string;
}

interface AnalysisOutput {
  significanceScore: number;    // 0-100
  emotionalDepth: number;       // 1-5
  qualityScore: number;         // 0-100
  wordCount: number;
  themes: string[];
  analysisTimestamp: number;
}

export const analyzeStory: CREFunction<AnalysisInput, AnalysisOutput> = async (
  input: AnalysisInput,
  context: CREContext
): Promise<AnalysisOutput> => {
  
  const { content, title } = input;
  
  // Validate input
  if (!content || content.length < 50) {
    throw new Error("Content too short for analysis");
  }
  
  // Calculate word count (verifiable, deterministic)
  const wordCount = content.trim().split(/\s+/).length;
  
  // Call AI for analysis
  // Note: In CRE, external API calls are logged and verifiable
  const aiAnalysis = await callAIAnalysis(content, title, context);
  
  // Normalize and validate scores
  const significanceScore = clamp(Math.round(aiAnalysis.significance * 100), 0, 100);
  const emotionalDepth = clamp(Math.round(aiAnalysis.emotionalDepth), 1, 5);
  const qualityScore = clamp(Math.round(aiAnalysis.quality * 100), 0, 100);
  
  // Extract and deduplicate themes
  const themes = [...new Set(aiAnalysis.themes)]
    .slice(0, 5)  // Max 5 themes
    .map(t => t.toLowerCase().trim());
  
  return {
    significanceScore,
    emotionalDepth,
    qualityScore,
    wordCount,
    themes,
    analysisTimestamp: Date.now(),
  };
};

async function callAIAnalysis(
  content: string, 
  title: string,
  context: CREContext
): Promise<{
  significance: number;
  emotionalDepth: number;
  quality: number;
  themes: string[];
}> {
  // Use Gemini API (or any AI provider)
  // CRE logs this call for verifiability
  
  const GEMINI_API_KEY = context.secrets.GEMINI_API_KEY;
  const GEMINI_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";
  
  const prompt = `
Analyze this personal story/journal entry and provide metrics.

Title: ${title}

Content:
${content.slice(0, 5000)}  // Limit for API

Respond ONLY with valid JSON in this exact format:
{
  "significance": <0.0-1.0 how significant/important this story is>,
  "emotionalDepth": <1-5 emotional depth level>,
  "quality": <0.0-1.0 writing quality and coherence>,
  "themes": [<up to 5 theme strings>]
}

Scoring guidelines:
- significance: Life-changing events = 0.9+, Routine daily events = 0.2-0.4
- emotionalDepth: 1 = factual/neutral, 5 = deeply emotional/vulnerable
- quality: Consider clarity, coherence, and expressiveness
- themes: Extract core themes like "growth", "relationships", "career", etc.
`;

  const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,  // Low temperature for consistency
        maxOutputTokens: 500,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error("Empty AI response");
  }

  // Parse JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Invalid AI response format");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  
  // Validate response structure
  if (
    typeof parsed.significance !== "number" ||
    typeof parsed.emotionalDepth !== "number" ||
    typeof parsed.quality !== "number" ||
    !Array.isArray(parsed.themes)
  ) {
    throw new Error("Invalid AI response structure");
  }

  return parsed;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export default analyzeStory;
```
</content>

<acceptance_criteria>
- [ ] Function compiles without errors
- [ ] Input/output types match workflow definition
- [ ] AI prompt produces consistent results
- [ ] Error handling covers edge cases
- [ ] Scores are properly clamped to valid ranges
</acceptance_criteria>
</task>

---

### Task 4: Smart Contract for Verified Metrics

<task id="CRE.4">
<objective>Create smart contract to store verified metrics on-chain</objective>

<file_to_create>
contracts/VerifiedMetrics.sol
</file_to_create>

<content>
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IStoryVerifiedMetrics
 * @notice Stores AI-analyzed story metrics verified by Chainlink CRE
 * @dev Only authorized CRE workflows can write to this contract
 */
contract IStoryVerifiedMetrics is Ownable {
    
    // ============ Structs ============
    
    struct VerifiedMetrics {
        uint8 significanceScore;    // 0-100
        uint8 emotionalDepth;       // 1-5
        uint8 qualityScore;         // 0-100
        uint32 wordCount;
        string[] themes;
        uint256 verifiedAt;
        bytes32 creAttestationId;
        bool exists;
    }
    
    // ============ State ============
    
    // storyId (as bytes32) => VerifiedMetrics
    mapping(bytes32 => VerifiedMetrics) public metrics;
    
    // Authorized CRE forwarder address
    address public creForwarder;
    
    // Total stories verified
    uint256 public totalVerified;
    
    // ============ Events ============
    
    event MetricsVerified(
        bytes32 indexed storyId,
        address indexed author,
        uint8 significanceScore,
        uint8 emotionalDepth,
        uint8 qualityScore,
        uint32 wordCount,
        bytes32 creAttestationId,
        uint256 timestamp
    );
    
    event CREForwarderUpdated(address indexed oldForwarder, address indexed newForwarder);
    
    // ============ Modifiers ============
    
    modifier onlyCRE() {
        require(msg.sender == creForwarder, "Only CRE forwarder can call");
        _;
    }
    
    // ============ Constructor ============
    
    constructor(address _creForwarder) Ownable(msg.sender) {
        creForwarder = _creForwarder;
    }
    
    // ============ CRE Functions ============
    
    /**
     * @notice Store verified metrics from CRE workflow
     * @dev Can only be called by the authorized CRE forwarder
     */
    function storeVerifiedMetrics(
        bytes32 storyId,
        address author,
        uint8 significanceScore,
        uint8 emotionalDepth,
        uint8 qualityScore,
        uint32 wordCount,
        string[] calldata themes,
        bytes32 creAttestationId
    ) external onlyCRE {
        require(!metrics[storyId].exists, "Metrics already verified");
        require(significanceScore <= 100, "Invalid significance score");
        require(emotionalDepth >= 1 && emotionalDepth <= 5, "Invalid emotional depth");
        require(qualityScore <= 100, "Invalid quality score");
        require(themes.length <= 10, "Too many themes");
        
        metrics[storyId] = VerifiedMetrics({
            significanceScore: significanceScore,
            emotionalDepth: emotionalDepth,
            qualityScore: qualityScore,
            wordCount: wordCount,
            themes: themes,
            verifiedAt: block.timestamp,
            creAttestationId: creAttestationId,
            exists: true
        });
        
        totalVerified++;
        
        emit MetricsVerified(
            storyId,
            author,
            significanceScore,
            emotionalDepth,
            qualityScore,
            wordCount,
            creAttestationId,
            block.timestamp
        );
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get verified metrics for a story
     */
    function getMetrics(bytes32 storyId) external view returns (
        uint8 significanceScore,
        uint8 emotionalDepth,
        uint8 qualityScore,
        uint32 wordCount,
        string[] memory themes,
        uint256 verifiedAt,
        bytes32 creAttestationId,
        bool exists
    ) {
        VerifiedMetrics storage m = metrics[storyId];
        return (
            m.significanceScore,
            m.emotionalDepth,
            m.qualityScore,
            m.wordCount,
            m.themes,
            m.verifiedAt,
            m.creAttestationId,
            m.exists
        );
    }
    
    /**
     * @notice Check if a story has verified metrics
     */
    function isVerified(bytes32 storyId) external view returns (bool) {
        return metrics[storyId].exists;
    }
    
    /**
     * @notice Get the CRE attestation ID for a story
     */
    function getAttestationId(bytes32 storyId) external view returns (bytes32) {
        require(metrics[storyId].exists, "Not verified");
        return metrics[storyId].creAttestationId;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Update the CRE forwarder address
     */
    function setCREForwarder(address _newForwarder) external onlyOwner {
        require(_newForwarder != address(0), "Invalid address");
        address oldForwarder = creForwarder;
        creForwarder = _newForwarder;
        emit CREForwarderUpdated(oldForwarder, _newForwarder);
    }
}
```
</content>

<deployment_script>
```typescript
// scripts/deployVerifiedMetrics.ts
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // CRE forwarder address (get from Chainlink docs for Base Sepolia)
  const CRE_FORWARDER = process.env.CRE_FORWARDER_ADDRESS;
  
  if (!CRE_FORWARDER) {
    throw new Error("CRE_FORWARDER_ADDRESS not set");
  }

  const VerifiedMetrics = await ethers.getContractFactory("IStoryVerifiedMetrics");
  const contract = await VerifiedMetrics.deploy(CRE_FORWARDER);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("VerifiedMetrics deployed to:", address);
  
  // Save for later use
  console.log("\nAdd to .env.local:");
  console.log(`VERIFIED_METRICS_CONTRACT=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```
</deployment_script>

<acceptance_criteria>
- [ ] Contract compiles without errors
- [ ] Only CRE forwarder can write metrics
- [ ] Metrics cannot be overwritten once set
- [ ] Events emitted correctly
- [ ] View functions return correct data
- [ ] Deployed to Base Sepolia
</acceptance_criteria>
</task>

---

### Task 5: Backend — CRE Trigger Endpoint

<task id="CRE.5">
<objective>Create API endpoint to trigger CRE workflow when story is created</objective>

<file_to_create>
app/api/cre/trigger/route.ts
</file_to_create>

<content>
```typescript
// app/api/cre/trigger/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/supabaseServer";

const CRE_API_URL = process.env.CRE_API_URL || "https://api.chain.link/cre/v1";
const CRE_API_KEY = process.env.CRE_API_KEY;
const CRE_WORKFLOW_ID = process.env.CRE_WORKFLOW_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface TriggerRequest {
  storyId: string;
}

export async function POST(request: NextRequest) {
  try {
    // Validate API key or session
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { storyId } = (await request.json()) as TriggerRequest;

    if (!storyId) {
      return NextResponse.json(
        { error: "storyId is required" },
        { status: 400 }
      );
    }

    // Fetch story to verify it exists and get author
    const supabase = await createClient();
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("id, title, content, author_wallet")
      .eq("id", storyId)
      .single();

    if (storyError || !story) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      );
    }

    // Check if already verified
    const { data: existing } = await supabase
      .from("verified_metrics")
      .select("id")
      .eq("story_id", storyId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Story already verified", verificationId: existing.id },
        { status: 409 }
      );
    }

    // Create content URL for CRE to fetch
    // Option 1: Direct Supabase URL (requires service key in CRE secrets)
    // Option 2: Public endpoint that returns content
    const contentUrl = `${APP_URL}/api/cre/content/${storyId}`;

    // Trigger CRE workflow
    const creResponse = await fetch(`${CRE_API_URL}/workflows/${CRE_WORKFLOW_ID}/runs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CRE-API-Key": CRE_API_KEY!,
      },
      body: JSON.stringify({
        input: {
          storyId: storyId,
          contentUrl: contentUrl,
          authorWallet: story.author_wallet,
          callbackUrl: `${APP_URL}/api/cre/webhook`,
        },
      }),
    });

    if (!creResponse.ok) {
      const errorText = await creResponse.text();
      console.error("CRE trigger failed:", errorText);
      return NextResponse.json(
        { error: "Failed to trigger verification" },
        { status: 500 }
      );
    }

    const creData = await creResponse.json();

    // Log the verification request
    await supabase.from("verification_logs").insert({
      story_id: storyId,
      workflow_run_id: creData.runId,
      status: "pending",
      triggered_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Verification started",
      workflowRunId: creData.runId,
    });

  } catch (error) {
    console.error("CRE trigger error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```
</content>

<acceptance_criteria>
- [ ] Validates authentication
- [ ] Checks story exists
- [ ] Prevents duplicate verification
- [ ] Successfully triggers CRE workflow
- [ ] Returns workflow run ID
- [ ] Logs verification request
</acceptance_criteria>
</task>

---

### Task 6: Backend — Content Endpoint for CRE

<task id="CRE.6">
<objective>Create endpoint for CRE to fetch story content</objective>

<file_to_create>
app/api/cre/content/[storyId]/route.ts
</file_to_create>

<content>
```typescript
// app/api/cre/content/[storyId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/supabaseServer";

const CRE_CONTENT_SECRET = process.env.CRE_CONTENT_SECRET;

export async function GET(
  request: NextRequest,
  { params }: { params: { storyId: string } }
) {
  try {
    // Verify request is from CRE (optional security layer)
    const authHeader = request.headers.get("authorization");
    if (CRE_CONTENT_SECRET && authHeader !== `Bearer ${CRE_CONTENT_SECRET}`) {
      // Log but don't block (CRE might not send this header)
      console.warn("Content request without proper auth");
    }

    const { storyId } = params;

    if (!storyId) {
      return NextResponse.json(
        { error: "storyId is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: story, error } = await supabase
      .from("stories")
      .select("id, title, content, author_wallet, created_at")
      .eq("id", storyId)
      .single();

    if (error || !story) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      );
    }

    // Return content for CRE to analyze
    return NextResponse.json({
      id: story.id,
      title: story.title,
      content: story.content,
      authorWallet: story.author_wallet,
      createdAt: story.created_at,
    });

  } catch (error) {
    console.error("Content fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```
</content>

<acceptance_criteria>
- [ ] Returns story content as JSON
- [ ] Handles missing stories gracefully
- [ ] Security headers logged (optional enforcement)
</acceptance_criteria>
</task>

---

### Task 7: Backend — CRE Webhook Handler

<task id="CRE.7">
<objective>Handle CRE completion webhook and cache results</objective>

<file_to_create>
app/api/cre/webhook/route.ts
</file_to_create>

<content>
```typescript
// app/api/cre/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/supabaseServer";

const CRE_WEBHOOK_SECRET = process.env.CRE_WEBHOOK_SECRET;

interface CREWebhookPayload {
  storyId: string;
  attestationId: string;
  workflowRunId: string;
  txHash: string;
  blockNumber: number;
  metrics: {
    significanceScore: number;
    emotionalDepth: number;
    qualityScore: number;
    wordCount: number;
    themes: string[];
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook is from CRE
    const secretHeader = request.headers.get("x-cre-webhook-secret");
    if (secretHeader !== CRE_WEBHOOK_SECRET) {
      console.error("Invalid webhook secret");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json()) as CREWebhookPayload;

    const {
      storyId,
      attestationId,
      workflowRunId,
      txHash,
      blockNumber,
      metrics,
    } = payload;

    // Validate payload
    if (!storyId || !attestationId || !metrics) {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Store verified metrics in cache table
    const { error: insertError } = await supabase
      .from("verified_metrics")
      .insert({
        story_id: storyId,
        significance_score: metrics.significanceScore,
        emotional_depth: metrics.emotionalDepth,
        quality_score: metrics.qualityScore,
        word_count: metrics.wordCount,
        verified_themes: metrics.themes,
        cre_attestation_id: attestationId,
        cre_workflow_run_id: workflowRunId,
        on_chain_tx_hash: txHash,
        on_chain_block_number: blockNumber,
        verified_at: new Date().toISOString(),
      });

    if (insertError) {
      // Check if duplicate (already verified)
      if (insertError.code === "23505") {
        console.log("Story already verified:", storyId);
        return NextResponse.json({ success: true, message: "Already verified" });
      }
      
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to store metrics" },
        { status: 500 }
      );
    }

    // Update verification log
    await supabase
      .from("verification_logs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        tx_hash: txHash,
      })
      .eq("workflow_run_id", workflowRunId);

    console.log(`Story ${storyId} verified successfully. TX: ${txHash}`);

    return NextResponse.json({
      success: true,
      storyId,
      txHash,
    });

  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```
</content>

<acceptance_criteria>
- [ ] Validates webhook secret
- [ ] Stores metrics in Supabase
- [ ] Handles duplicate gracefully
- [ ] Updates verification log
- [ ] Returns success response
</acceptance_criteria>
</task>

---

### Task 8: Auto-Trigger Verification on Story Save

<task id="CRE.8">
<objective>Automatically trigger CRE verification when a story is saved</objective>

<file_to_modify>
Find your existing story save endpoint (e.g., app/api/stories/route.ts or similar)
</file_to_modify>

<modification>
Add this after successfully saving a story:

```typescript
// After story is saved to Supabase...

// Trigger CRE verification in background (don't await)
triggerVerification(story.id).catch((err) => {
  console.error("Failed to trigger verification:", err);
  // Don't fail the request - verification is async
});

// Helper function
async function triggerVerification(storyId: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cre/trigger`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.INTERNAL_API_KEY}`,
    },
    body: JSON.stringify({ storyId }),
  });
  
  if (!response.ok) {
    throw new Error(`Verification trigger failed: ${response.status}`);
  }
}
```
</modification>

<acceptance_criteria>
- [ ] Verification triggers automatically on story save
- [ ] Story save doesn't fail if verification trigger fails
- [ ] Verification runs asynchronously in background
</acceptance_criteria>
</task>

---

### Task 9: Frontend — Verified Badge Component

<task id="CRE.9">
<objective>Create component to display verification status</objective>

<file_to_create>
components/VerifiedBadge.tsx
</file_to_create>

<content>
```typescript
// components/VerifiedBadge.tsx
"use client";

import { CheckCircle, Clock, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  status: "verified" | "pending" | "unverified";
  txHash?: string;
  className?: string;
  showLabel?: boolean;
}

export function VerifiedBadge({ 
  status, 
  txHash, 
  className,
  showLabel = true,
}: VerifiedBadgeProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BLOCK_EXPLORER || "https://sepolia.basescan.org";
  
  if (status === "verified") {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <CheckCircle className="h-4 w-4 text-green-500" />
        {showLabel && (
          <span className="text-sm text-green-600 font-medium">
            Verified
          </span>
        )}
        {txHash && (
          <a
            href={`${baseUrl}/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 hover:text-green-700"
            title="View proof on-chain"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    );
  }
  
  if (status === "pending") {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />
        {showLabel && (
          <span className="text-sm text-yellow-600">
            Verifying...
          </span>
        )}
      </div>
    );
  }
  
  // Unverified - show nothing or subtle indicator
  return null;
}
```
</content>

<acceptance_criteria>
- [ ] Shows green checkmark when verified
- [ ] Shows spinner when pending
- [ ] Shows nothing when unverified
- [ ] Links to block explorer when txHash provided
</acceptance_criteria>
</task>

---

### Task 10: Frontend — Verified Metrics Card

<task id="CRE.10">
<objective>Create component to display verified metrics on paywalled stories</objective>

<file_to_create>
components/VerifiedMetricsCard.tsx
</file_to_create>

<content>
```typescript
// components/VerifiedMetricsCard.tsx
"use client";

import { CheckCircle, ExternalLink, Sparkles, Heart, FileText, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedMetrics {
  significanceScore: number;
  emotionalDepth: number;
  qualityScore: number;
  wordCount: number;
  themes: string[];
  txHash?: string;
  attestationId?: string;
}

interface VerifiedMetricsCardProps {
  metrics: VerifiedMetrics | null;
  isPending?: boolean;
  className?: string;
}

export function VerifiedMetricsCard({ 
  metrics, 
  isPending = false,
  className,
}: VerifiedMetricsCardProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BLOCK_EXPLORER || "https://sepolia.basescan.org";
  
  // Show loading state
  if (isPending) {
    return (
      <div className={cn(
        "rounded-lg border border-yellow-200 bg-yellow-50 p-4",
        className
      )}>
        <div className="flex items-center gap-2 text-yellow-700">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-yellow-500 border-t-transparent" />
          <span className="text-sm font-medium">Verifying content metrics...</span>
        </div>
        <p className="mt-2 text-xs text-yellow-600">
          AI analysis is being verified by Chainlink CRE
        </p>
      </div>
    );
  }
  
  // No metrics yet
  if (!metrics) {
    return null;
  }
  
  const emotionalDepthLabels = ["", "Factual", "Light", "Moderate", "Deep", "Profound"];
  
  return (
    <div className={cn(
      "rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-sm font-semibold text-green-800">
            Verified Story Metrics
          </span>
        </div>
        {metrics.txHash && (
          <a
            href={`${baseUrl}/tx/${metrics.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 hover:underline"
          >
            View Proof
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Significance */}
        <div className="flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-amber-500 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Significance</p>
            <p className="text-lg font-bold text-gray-900">
              {metrics.significanceScore}
              <span className="text-sm font-normal text-gray-400">/100</span>
            </p>
          </div>
        </div>
        
        {/* Emotional Depth */}
        <div className="flex items-start gap-2">
          <Heart className="h-4 w-4 text-rose-500 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Emotional Depth</p>
            <p className="text-sm font-semibold text-gray-900">
              {emotionalDepthLabels[metrics.emotionalDepth]}
            </p>
          </div>
        </div>
        
        {/* Quality */}
        <div className="flex items-start gap-2">
          <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Quality Score</p>
            <p className="text-lg font-bold text-gray-900">
              {metrics.qualityScore}
              <span className="text-sm font-normal text-gray-400">/100</span>
            </p>
          </div>
        </div>
        
        {/* Word Count */}
        <div className="flex items-start gap-2">
          <FileText className="h-4 w-4 text-purple-500 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Word Count</p>
            <p className="text-lg font-bold text-gray-900">
              {metrics.wordCount.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
      
      {/* Themes */}
      {metrics.themes.length > 0 && (
        <div className="mt-3 pt-3 border-t border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="h-4 w-4 text-green-600" />
            <p className="text-xs text-gray-500">Verified Themes</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {metrics.themes.map((theme, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Footer */}
      <p className="mt-3 text-xs text-green-600">
        Verified by Chainlink CRE • Metrics cannot be modified by creator
      </p>
    </div>
  );
}
```
</content>

<acceptance_criteria>
- [ ] Displays all metrics clearly
- [ ] Shows pending state during verification
- [ ] Links to on-chain proof
- [ ] Themes displayed as badges
- [ ] Clear "Verified by Chainlink CRE" attribution
</acceptance_criteria>
</task>

---

### Task 11: Frontend — Hook for Verified Metrics

<task id="CRE.11">
<objective>Create hook to fetch verified metrics for a story</objective>

<file_to_create>
hooks/useVerifiedMetrics.ts
</file_to_create>

<content>
```typescript
// hooks/useVerifiedMetrics.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/app/utils/supabase/supabaseClient";

interface VerifiedMetrics {
  significanceScore: number;
  emotionalDepth: number;
  qualityScore: number;
  wordCount: number;
  themes: string[];
  txHash: string | null;
  attestationId: string;
  verifiedAt: string;
}

interface UseVerifiedMetricsReturn {
  metrics: VerifiedMetrics | null;
  isPending: boolean;
  isVerified: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useVerifiedMetrics(storyId: string | null): UseVerifiedMetricsReturn {
  const [metrics, setMetrics] = useState<VerifiedMetrics | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  const fetchMetrics = useCallback(async () => {
    if (!storyId) {
      setMetrics(null);
      setIsPending(false);
      return;
    }

    try {
      // Check for verified metrics
      const { data, error: fetchError } = await supabase
        .from("verified_metrics")
        .select(`
          significance_score,
          emotional_depth,
          quality_score,
          word_count,
          verified_themes,
          on_chain_tx_hash,
          cre_attestation_id,
          verified_at
        `)
        .eq("story_id", storyId)
        .single();

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          // Not found - check if pending
          const { data: logData } = await supabase
            .from("verification_logs")
            .select("status")
            .eq("story_id", storyId)
            .order("triggered_at", { ascending: false })
            .limit(1)
            .single();

          if (logData?.status === "pending") {
            setIsPending(true);
          } else {
            setIsPending(false);
          }
          setMetrics(null);
        } else {
          throw fetchError;
        }
      } else if (data) {
        setMetrics({
          significanceScore: data.significance_score,
          emotionalDepth: data.emotional_depth,
          qualityScore: data.quality_score,
          wordCount: data.word_count,
          themes: data.verified_themes || [],
          txHash: data.on_chain_tx_hash,
          attestationId: data.cre_attestation_id,
          verifiedAt: data.verified_at,
        });
        setIsPending(false);
      }
      
      setError(null);
    } catch (err) {
      console.error("Error fetching verified metrics:", err);
      setError("Failed to fetch verification status");
    }
  }, [storyId, supabase]);

  // Initial fetch
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Poll for updates while pending
  useEffect(() => {
    if (!isPending) return;

    const interval = setInterval(fetchMetrics, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [isPending, fetchMetrics]);

  return {
    metrics,
    isPending,
    isVerified: metrics !== null,
    error,
    refetch: fetchMetrics,
  };
}
```
</content>

<acceptance_criteria>
- [ ] Fetches metrics from Supabase
- [ ] Detects pending state
- [ ] Polls while pending
- [ ] Provides refetch function
- [ ] Handles errors gracefully
</acceptance_criteria>
</task>

---

### Task 12: Integrate Into Story Preview (Paywall View)

<task id="CRE.12">
<objective>Add verified metrics to paywalled story preview</objective>

<file_to_modify>
Find your story card or story preview component (where paywalled stories are shown)
</file_to_modify>

<example_integration>
```typescript
// Example: components/StoryCard.tsx or similar

import { VerifiedMetricsCard } from "@/components/VerifiedMetricsCard";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { useVerifiedMetrics } from "@/hooks/useVerifiedMetrics";

export function StoryCard({ story, isPaywalled }: StoryCardProps) {
  const { metrics, isPending, isVerified } = useVerifiedMetrics(story.id);
  
  return (
    <div className="story-card">
      {/* Story Header */}
      <div className="flex items-center justify-between">
        <h3>{story.title}</h3>
        <VerifiedBadge 
          status={isVerified ? "verified" : isPending ? "pending" : "unverified"}
          txHash={metrics?.txHash}
        />
      </div>
      
      {/* Author info, preview, etc. */}
      <p className="text-gray-600">{story.preview}</p>
      
      {/* SHOW VERIFIED METRICS FOR PAYWALLED CONTENT */}
      {isPaywalled && (
        <VerifiedMetricsCard 
          metrics={metrics}
          isPending={isPending}
        />
      )}
      
      {/* Paywall action */}
      {isPaywalled && (
        <button className="paywall-button">
          🔒 Pay {story.paywallPrice} $STORY to unlock
        </button>
      )}
    </div>
  );
}
```
</example_integration>

<acceptance_criteria>
- [ ] Verified metrics appear on paywalled stories
- [ ] Badge shows in story header
- [ ] Pending state handled gracefully
- [ ] Works with existing UI styling
</acceptance_criteria>
</task>

---

### Task 13: Deploy CRE Workflow

<task id="CRE.13">
<objective>Deploy the CRE workflow and configure secrets</objective>

<steps>
```bash
# 1. Navigate to CRE directory
cd cre

# 2. Add secrets to CRE
cre secrets set SUPABASE_SERVICE_KEY "your-supabase-service-key"
cre secrets set GEMINI_API_KEY "your-gemini-api-key"
cre secrets set WEBHOOK_SECRET "your-webhook-secret"
cre secrets set VERIFIED_METRICS_CONTRACT "0x-your-contract-address"

# 3. Deploy the workflow
cre workflows deploy workflows/story-verification.yaml

# 4. Note the workflow ID
# Output: Workflow deployed: wf_abc123...

# 5. Add workflow ID to your .env.local
echo "CRE_WORKFLOW_ID=wf_abc123" >> ../.env.local

# 6. Verify deployment
cre workflows list
cre workflows describe wf_abc123
```
</steps>

<acceptance_criteria>
- [ ] All secrets configured in CRE
- [ ] Workflow deployed successfully
- [ ] Workflow ID saved to environment
- [ ] Can describe workflow without errors
</acceptance_criteria>
</task>

---

### Task 14: End-to-End Testing

<task id="CRE.14">
<objective>Test the complete flow from story creation to verified metrics display</objective>

<test_script>
```bash
# Terminal 1: Start your app
npm run dev

# Terminal 2: Watch logs
# (set up logging to see CRE trigger and webhook)

# Manual test steps:
```
</test_script>

<test_steps>
```
□ Step 1: Create a new story
  - Record voice or type content
  - Save the story
  - Note the story ID

□ Step 2: Verify CRE triggered
  - Check server logs for "CRE workflow triggered"
  - Check CRE dashboard for running workflow

□ Step 3: Wait for verification (~30-60 seconds)
  - Refresh the story page
  - Should see "Verifying..." state

□ Step 4: Verify completion
  - After CRE completes, page should show verified metrics
  - Green badge with "Verified" text
  - All metrics displayed (significance, depth, quality, etc.)

□ Step 5: Verify on-chain
  - Click "View Proof" link
  - Should open BaseScan showing the transaction
  - Transaction should show MetricsVerified event

□ Step 6: Test paywall view
  - View the story as a different user
  - If paywalled, should see VerifiedMetricsCard
  - All metrics should display correctly

□ Step 7: Test edge cases
  - Very short story (should still work or error gracefully)
  - Duplicate verification attempt (should say "already verified")
  - Network failure (should not break the app)
```
</test_steps>

<acceptance_criteria>
- [ ] Story saves successfully
- [ ] CRE workflow triggers automatically
- [ ] Webhook received and processed
- [ ] Metrics stored in Supabase
- [ ] Metrics stored on-chain
- [ ] Frontend displays verified badge
- [ ] Frontend displays metrics card
- [ ] Block explorer link works
</acceptance_criteria>
</task>

---

## 🎬 Hackathon Demo Script

For your hackathon presentation:

### Demo Flow (3 minutes)

```
[0:00-0:30] INTRO
"Hi, I'm [name] and this is iStory — voice journaling where 
buyers can trust what they're paying for."

[0:30-1:00] THE PROBLEM
"Web3 content platforms have a trust problem. Creators can 
claim their content is 'high quality' or 'deeply significant' 
to get sales, but buyers have no way to verify."

Show: Paywalled story WITHOUT verified metrics
"Would you pay 50 tokens for this? How do you know it's worth it?"

[1:00-2:00] THE SOLUTION
"iStory uses Chainlink CRE to verify content metrics."

Action: Create a new story (pre-record this to save time)
"When I save this story, CRE automatically analyzes it."

Show: Verification in progress
"The AI analysis is running in Chainlink's verifiable compute 
environment — not on my servers."

Show: Completed verification
"Now we have verified metrics: significance 87/100, emotional 
depth: high, quality: 92/100. The creator can't fake these."

[2:00-2:30] THE PROOF
Click: "View Proof" link
"And here's the transaction on Base. Anyone can verify these 
metrics were computed by CRE, not by the creator."

[2:30-3:00] CLOSING
"iStory shows how CRE can solve the AI trust problem in Web3. 
Verifiable AI metrics that protect buyers and reward quality creators.

Thank you."
```

---

## 📁 File Summary

### New Files to Create

| File | Purpose |
|------|---------|
| `cre/workflows/story-verification.yaml` | CRE workflow definition |
| `cre/functions/analyzeStory.ts` | AI analysis function for CRE |
| `contracts/VerifiedMetrics.sol` | Smart contract for on-chain storage |
| `scripts/deployVerifiedMetrics.ts` | Deployment script |
| `app/api/cre/trigger/route.ts` | Trigger CRE workflow |
| `app/api/cre/content/[storyId]/route.ts` | Serve content to CRE |
| `app/api/cre/webhook/route.ts` | Handle CRE completion |
| `components/VerifiedBadge.tsx` | Verification status badge |
| `components/VerifiedMetricsCard.tsx` | Full metrics display |
| `hooks/useVerifiedMetrics.ts` | Fetch verified metrics |

### Files to Modify

| File | Change |
|------|--------|
| Story save endpoint | Add CRE trigger call |
| Story card/preview component | Add verified metrics display |
| `.env.local` | Add CRE environment variables |

### Database Changes

| Table | Change |
|-------|--------|
| `verified_metrics` | New table |
| `verification_logs` | New table (optional, for debugging) |

---

## ✅ Final Checklist

Before hackathon submission:

```
REUSABLE TOOLS (Do First!)
□ CRE Sub-Agent created (scripts/cre-agent.ts)
□ CRE Skills folder created (skills/cre/)
□ Templates ready (workflow-ai.yaml, contract-verifier.sol)
□ Agent tested and working

INFRASTRUCTURE
□ CRE CLI installed and authenticated
□ CRE workflow deployed
□ Smart contract deployed to Base Sepolia
□ All environment variables set

BACKEND
□ Trigger endpoint working
□ Content endpoint working
□ Webhook endpoint working
□ Auto-trigger on story save

FRONTEND
□ VerifiedBadge component
□ VerifiedMetricsCard component
□ useVerifiedMetrics hook
□ Integration with story views

TESTING
□ End-to-end flow works
□ On-chain verification works
□ Block explorer link works
□ Edge cases handled

DEMO
□ Demo script practiced
□ Pre-recorded backup (in case of network issues)
□ Submission materials ready
```

---

## 🔄 Reusability Note

The CRE Sub-Agent and Skills you created are **NOT specific to iStory**. They can be used for ANY project that needs Chainlink CRE integration:

### For Future Projects

```bash
# Copy the CRE agent to a new project
cp scripts/cre-agent.ts ../new-project/scripts/

# Copy the skills folder
cp -r skills/cre ../new-project/skills/

# Use templates as starting points
cp skills/cre/templates/workflow-ai.yaml cre/workflows/my-workflow.yaml
```

### What's Reusable

| Asset | Reusability |
|-------|-------------|
| `scripts/cre-agent.ts` | 100% — Works for any CRE question |
| `skills/cre/SKILL.md` | 100% — General CRE knowledge |
| `templates/workflow-ai.yaml` | 90% — Customize inputs/outputs |
| `templates/contract-verifier.sol` | 90% — Customize data structure |
| `functions/ai-analysis.ts` | 80% — Customize AI logic |

### CRE Agent Use Cases (Any Project)

```bash
# DeFi project
npx ts-node scripts/cre-agent.ts "How do I verify price feeds with CRE?"

# Gaming project  
npx ts-node scripts/cre-agent.ts "Design CRE workflow for verifying game scores"

# NFT project
npx ts-node scripts/cre-agent.ts "How to verify NFT metadata authenticity with CRE?"

# General debugging
npx ts-node scripts/cre-agent.ts "My CRE attestation is failing" --error "Invalid signature"
```

**You now have CRE expertise as a portable tool!**

---

## 🚀 Start Implementation

**IMPORTANT: Begin with the reusable tools first!**

### Step 1: Create CRE Sub-Agent (Task 0.1)
```
@task CRE.0.1
<begin>
Create scripts/cre-agent.ts with the CRE-specialized sub-agent.
Test with: npx ts-node scripts/cre-agent.ts "What is CRE?"
Report completion.
</begin>
```

### Step 2: Create CRE Skills (Task 0.2)
```
@task CRE.0.2
<begin>
Create skills/cre/ folder structure.
Create SKILL.md with documentation.
Create templates (workflow-ai.yaml, contract-verifier.sol).
Create function templates.
Report completion.
</begin>
```

### Step 3: Register Skills (Task 0.3)
```
@task CRE.0.3
<begin>
Add CRE skill to project's skill registry.
Verify it's discoverable.
Report completion.
</begin>
```

### Step 4: Continue with iStory Implementation (Task 0 onwards)
```
@task CRE.0
<begin>
Set up CRE environment.
Use the CRE agent if you encounter issues.
Reference skills/cre/ templates.
Report completion.
</begin>
```

### When Stuck: Use the CRE Agent
```bash
# Example: If you're unsure about workflow design
npx ts-node scripts/cre-agent.ts "How should I structure the verification workflow for content metrics?"

# Example: If you hit an error
npx ts-node scripts/cre-agent.ts "Getting attestation error" --error "Verification failed on contract call"

# Example: If you need architecture advice
npx ts-node scripts/cre-agent.ts "Should I store all metrics on-chain or just the hash?"
```

Good luck with the hackathon! 🎉