/**
 * CRE AI Analysis Function Template
 *
 * Reusable AI analysis helper for CRE compute steps.
 * Calls Gemini Flash via HTTP for structured text analysis.
 *
 * Usage in CRE workflow:
 *   import { analyzeContent } from "./ai-analysis"
 *   const result = analyzeContent(nodeRuntime, text)
 */

import type { NodeRuntime } from "@chainlink/cre-sdk";

export interface AnalysisConfig {
  apiKey: string;
}

export interface ContentAnalysis {
  significanceScore: number;   // 0-100
  emotionalDepth: number;      // 1-5
  qualityScore: number;        // 0-100
  wordCount: number;
  themes: string[];
}

/**
 * Analyze text content using Gemini Flash.
 * Uses low temperature (0.1) for consistency across CRE nodes.
 */
export function analyzeContent(
  nodeRuntime: NodeRuntime<AnalysisConfig>,
  text: string
): ContentAnalysis {
  const prompt = `Analyze this text and return a JSON object with exactly these fields:
- significanceScore: number 0-100 (how significant/meaningful is this content)
- emotionalDepth: number 1-5 (depth of emotional expression)
- qualityScore: number 0-100 (writing quality, coherence, structure)
- wordCount: number (exact word count)
- themes: string[] (2-5 main themes, lowercase)

Text to analyze:
"""
${text}
"""

Return ONLY valid JSON, no explanation.`;

  const response = nodeRuntime.httpClient.sendRequest({
    url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": nodeRuntime.config.apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    }),
  });

  if (response.statusCode !== 200) {
    throw new Error(`Gemini API error: ${response.statusCode}`);
  }

  const geminiResponse = JSON.parse(response.body);
  const resultText = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!resultText) {
    throw new Error("No content in Gemini response");
  }

  const raw = JSON.parse(resultText);

  // Validate and clamp scores
  return {
    significanceScore: clamp(Math.round(raw.significanceScore || 0), 0, 100),
    emotionalDepth: clamp(Math.round(raw.emotionalDepth || 1), 1, 5),
    qualityScore: clamp(Math.round(raw.qualityScore || 0), 0, 100),
    wordCount: Math.max(0, Math.round(raw.wordCount || 0)),
    themes: deduplicateThemes(raw.themes || []),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function deduplicateThemes(themes: string[]): string[] {
  const unique = [...new Set(themes.map((t: string) => t.toLowerCase().trim()))];
  return unique.slice(0, 5);
}
