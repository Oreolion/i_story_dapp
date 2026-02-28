/**
 * CRE AI Analysis — Gemini Flash with ConfidentialHTTPClient
 *
 * Uses ConfidentialHTTPClient so the Gemini API call (which contains
 * the user's private story content) runs inside the encrypted enclave.
 * Story content never leaves the enclave unencrypted.
 *
 * API key is injected via Vault DON template syntax, not runtime.getSecret().
 */

import {
  ConfidentialHTTPClient,
  consensusIdenticalAggregation,
  ok,
  type Runtime,
  type ConfidentialHTTPSendRequester,
} from "@chainlink/cre-sdk";
import type { Config } from "./main";

// Analysis prompt
const SYSTEM_PROMPT = `You are a content quality analyst. Analyze the provided story and return a JSON object with exactly these fields:

- significanceScore: number 0-100 (how meaningful/impactful to the author's personal growth)
- emotionalDepth: number 1-5 (1=surface, 2=mild, 3=moderate, 4=deep, 5=profound)
- qualityScore: number 0-100 (writing quality: coherence, structure, vocabulary, narrative flow)
- wordCount: number (exact word count of the content)
- themes: string[] (2-5 main themes, lowercase, e.g. ["growth", "family", "resilience"])

STRICT RULES:
- Output MUST be valid JSON. No markdown, no backticks, no explanation.
- Output MUST be MINIFIED (one line).
- Return ONLY the JSON object.`;

export interface StoryMetrics {
  significanceScore: number;
  emotionalDepth: number;
  qualityScore: number;
  wordCount: number;
  themes: string[];
}

interface GeminiApiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

interface GeminiResult {
  statusCode: number;
  metrics: StoryMetrics;
}

/**
 * Analyze story content using Gemini via CRE ConfidentialHTTPClient.
 * Story content stays encrypted inside the DON enclave.
 */
export function askGemini(
  runtime: Runtime<Config>,
  title: string,
  content: string
): StoryMetrics {
  runtime.log("[Gemini] Querying AI for story analysis (confidential)...");

  const confClient = new ConfidentialHTTPClient();

  const result = confClient
    .sendRequest(
      runtime,
      buildGeminiRequest(title, content),
      consensusIdenticalAggregation<GeminiResult>()
    )(runtime.config)
    .result();

  runtime.log(
    `[Gemini] Analysis complete: significance=${result.metrics.significanceScore}, quality=${result.metrics.qualityScore}`
  );
  return result.metrics;
}

/**
 * Build the Gemini request function for ConfidentialHTTPClient.
 * Returns a curried function: (sendRequester, config) => GeminiResult
 *
 * Key differences from HTTPClient:
 * - Uses ConfidentialHTTPSendRequester instead of HTTPSendRequester
 * - API key via Vault DON template: {{.geminiApiKey}}
 * - multiHeaders instead of headers
 * - vaultDonSecrets to reference Vault DON secrets
 * - Request body (story content) encrypted inside enclave
 */
const buildGeminiRequest =
  (title: string, content: string) =>
  (sendRequester: ConfidentialHTTPSendRequester, config: Config): GeminiResult => {
    const userPrompt = `Title: "${title}"

Content:
"""
${content}
"""`;

    const requestData = {
      contents: [
        {
          parts: [{ text: SYSTEM_PROMPT + "\n\n" + userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    };

    const bodyBytes = new TextEncoder().encode(JSON.stringify(requestData));
    const body = Buffer.from(bodyBytes).toString("base64");

    const resp = sendRequester
      .sendRequest({
        request: {
          url: `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent`,
          method: "POST" as const,
          body,
          multiHeaders: {
            "Content-Type": { values: ["application/json"] },
            "x-goog-api-key": { values: ["{{.geminiApiKey}}"] },
          },
        },
        vaultDonSecrets: [
          { key: "geminiApiKey", owner: config.owner },
        ],
        // encryptOutput not used — we need to parse the response in-workflow
      })
      .result();

    const bodyText = new TextDecoder().decode(resp.body);

    if (!ok(resp)) {
      throw new Error(`Gemini API error: ${resp.statusCode} - ${bodyText}`);
    }

    const apiResponse = JSON.parse(bodyText) as GeminiApiResponse;
    const resultText =
      apiResponse?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error("Malformed Gemini response: missing text");
    }

    const raw = JSON.parse(resultText);

    // Validate and clamp scores
    const metrics: StoryMetrics = {
      significanceScore: clamp(Math.round(raw.significanceScore || 0), 0, 100),
      emotionalDepth: clamp(Math.round(raw.emotionalDepth || 1), 1, 5),
      qualityScore: clamp(Math.round(raw.qualityScore || 0), 0, 100),
      wordCount: Math.max(0, Math.round(raw.wordCount || 0)),
      themes: deduplicateThemes(raw.themes || []),
    };

    return {
      statusCode: resp.statusCode,
      metrics,
    };
  };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function deduplicateThemes(themes: unknown[]): string[] {
  const strings = themes
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.toLowerCase().trim());
  const unique = [...new Set(strings)];
  return unique.slice(0, 5);
}
