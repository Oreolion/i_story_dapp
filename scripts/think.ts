// File: scripts/think.ts
// Run with: npx ts-node scripts/think.ts "your problem description"

import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

interface ThinkingRequest {
  problem: string;
  context: string;
  constraints: string[];
  currentApproach?: string;
  failedAttempts?: string[];
}

async function thinkDeep(request: ThinkingRequest): Promise<string> {
  const systemPrompt = `You are a senior software architect and PhD-level engineer.
Your role is to think deeply about complex problems and provide well-reasoned solutions.

When analyzing a problem:
1. Restate the problem to ensure understanding
2. Identify all constraints and requirements
3. Consider multiple approaches (at least 3)
4. Analyze trade-offs of each approach
5. Recommend the best approach with justification
6. Provide implementation guidance
7. Identify potential pitfalls and how to avoid them

Be thorough, precise, and practical.`;

  const userPrompt = `
## Problem
${request.problem}

## Context
${request.context}

## Constraints
${request.constraints.map((c, i) => `${i + 1}. ${c}`).join("\n")}

${request.currentApproach ? `## Current Approach\n${request.currentApproach}` : ""}

${request.failedAttempts?.length ? `## Failed Attempts\n${request.failedAttempts.map((a, i) => `${i + 1}. ${a}`).join("\n")}` : ""}

Please analyze this problem deeply and provide a recommended solution.
`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 16000,
    thinking: {
      type: "enabled",
      budget_tokens: 10000, // Allow extensive thinking
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

  return `
## Thinking Process
${thinking}

## Recommended Solution
${answer}
`;
}

// CLI usage
const problem = process.argv[2];
if (!problem) {
  console.error("Usage: npx ts-node scripts/think.ts 'problem description'");
  process.exit(1);
}

// Example with full context
thinkDeep({
  problem: problem,
  context: `
    iStory is a Web3 AI-powered journaling dApp.
    Tech stack: Next.js 15, React 19, Supabase, Gemini AI, Base blockchain.
    Currently implementing Phase 1.5: Validation & Hardening.
    Phase 1 (Story Metadata) is complete - we have automatic story analysis.
  `,
  constraints: [
    "Must maintain backward compatibility",
    "Must not break existing functionality",
    "Must follow existing code patterns in the project",
    "Performance must not degrade",
    "Must work with Supabase RLS policies",
  ],
}).then(console.log).catch(console.error);
