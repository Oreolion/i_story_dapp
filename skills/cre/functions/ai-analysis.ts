/**
 * CRE AI Analysis Function — Gemini via HTTPClient Consensus
 *
 * Reusable AI analysis helper for CRE workflows.
 * Uses the HTTPClient "sugar" pattern for DON node consensus.
 *
 * CORRECT SDK pattern (tested and verified):
 *   1. runtime.getSecret({ id: "GEMINI_API_KEY" }) — access CRE-managed secrets
 *   2. httpClient.sendRequest(runtime, buildFn, consensusIdenticalAggregation<T>())
 *   3. Body must be base64-encoded: Buffer.from(new TextEncoder().encode(json)).toString("base64")
 *   4. Response body decoded: new TextDecoder().decode(resp.body)
 *
 * WRONG patterns (will fail):
 *   - nodeRuntime.httpClient.sendRequest({...}) — old pattern, doesn't exist
 *   - runtime.runInNodeMode(...) — doesn't exist in CRE SDK
 *   - Passing JSON string directly as body — must be base64
 */

import {
  cre,
  ok,
  consensusIdenticalAggregation,
  type Runtime,
  type HTTPSendRequester,
} from "@chainlink/cre-sdk";

// ─── Types ───────────────────────────────────────────────────────────

export interface ContentAnalysis {
  significanceScore: number; // 0-100
  emotionalDepth: number; // 1-5
  qualityScore: number; // 0-100
  wordCount: number;
  themes: string[];
}

interface GeminiResult {
  metrics: ContentAnalysis;
}

// ─── Main Analysis Function ──────────────────────────────────────────

/**
 * Analyze text content using Gemini AI with DON consensus.
 * All nodes query Gemini independently and must agree on the result.
 */
export function analyzeContent<C extends { geminiModel: string }>(
  runtime: Runtime<C>,
  title: string,
  content: string
): ContentAnalysis {
  const geminiApiKey = runtime.getSecret({ id: "GEMINI_API_KEY" }).result();
  const httpClient = new cre.capabilities.HTTPClient();

  const result = httpClient
    .sendRequest(
      runtime,
      buildGeminiRequest(title, content, geminiApiKey.value),
      consensusIdenticalAggregation<GeminiResult>()
    )(runtime.config)
    .result();

  return result.metrics;
}

// ─── Request Builder ─────────────────────────────────────────────────

const buildGeminiRequest =
  <C extends { geminiModel: string }>(
    title: string,
    content: string,
    apiKey: string
  ) =>
  (sendRequester: HTTPSendRequester, config: C): GeminiResult => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent?key=${apiKey}`;

    const prompt = `Analyze this story and return a JSON object with exactly these fields:
- significanceScore: number 0-100 (how significant/meaningful)
- emotionalDepth: number 1-5 (depth of emotional expression)
- qualityScore: number 0-100 (writing quality)
- wordCount: number (exact word count)
- themes: string[] (2-5 main themes, lowercase)

Title: "${title}"
Content: "${content}"

Return ONLY a JSON object with a "metrics" key containing these fields.`;

    const requestData = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    };

    // CRITICAL: Body must be base64-encoded for CRE HTTPClient
    const bodyBytes = new TextEncoder().encode(JSON.stringify(requestData));
    const body = Buffer.from(bodyBytes).toString("base64");

    const resp = sendRequester
      .sendRequest({
        url,
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
      })
      .result();

    // Decode response body from Uint8Array
    const bodyText = new TextDecoder().decode(resp.body);
    const parsed = JSON.parse(bodyText);
    const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const raw = JSON.parse(text);

    // Extract and clamp metrics
    const m = raw.metrics || raw;
    return {
      metrics: {
        significanceScore: clamp(Math.round(m.significanceScore || 0), 0, 100),
        emotionalDepth: clamp(Math.round(m.emotionalDepth || 1), 1, 5),
        qualityScore: clamp(Math.round(m.qualityScore || 0), 0, 100),
        wordCount: Math.max(0, Math.round(m.wordCount || 0)),
        themes: deduplicateThemes(m.themes || []),
      },
    };
  };

// ─── Helpers ─────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function deduplicateThemes(themes: string[]): string[] {
  const unique = [...new Set(themes.map((t: string) => t.toLowerCase().trim()))];
  return unique.slice(0, 5);
}
