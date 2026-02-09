/**
 * CRE AI Workflow Template
 *
 * Pattern: HTTP Trigger → Fetch Data → AI Analysis → On-Chain Write
 *
 * Usage:
 * 1. Copy to cre/src/workflows/your-workflow/index.ts
 * 2. Customize Config type with your secrets
 * 3. Implement fetchData() and analyzeWithAI()
 * 4. Update contract address and function signature
 */

import { cre, type Runtime, type NodeRuntime } from "@chainlink/cre-sdk";

// -- Config: secrets injected at runtime --
type Config = {
  apiUrl: string;          // Your app's API URL
  apiKey: string;          // AI service API key
  contentSecret: string;   // Secret for content endpoint auth
};

// -- Trigger payload --
type HTTPPayload = {
  body: string;
  headers: Record<string, string>;
};

// -- Your data types --
interface AnalysisResult {
  score: number;
  category: string;
  confidence: number;
}

// -- Main handler --
const handler = (runtime: Runtime<Config>, payload: HTTPPayload) => {
  const input = JSON.parse(payload.body);

  // Step 1: Fetch data (runs in node mode for HTTP access)
  const data = runtime.runInNodeMode((nodeRuntime: NodeRuntime<Config>) => {
    const response = nodeRuntime.httpClient.sendRequest({
      url: `${nodeRuntime.config.apiUrl}/api/data/${input.id}`,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-CRE-Secret": nodeRuntime.config.contentSecret,
      },
    });

    if (response.statusCode !== 200) {
      throw new Error(`Failed to fetch data: ${response.statusCode}`);
    }

    return JSON.parse(response.body);
  });

  // Step 2: AI Analysis (runs in node mode)
  const analysis = runtime.runInNodeMode((nodeRuntime: NodeRuntime<Config>) => {
    const response = nodeRuntime.httpClient.sendRequest({
      url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": nodeRuntime.config.apiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze this content and return JSON: ${JSON.stringify(data)}`
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      }),
    });

    return JSON.parse(response.body) as AnalysisResult;
  });

  // Step 3: Write on-chain
  runtime.evmClient.writeReport({
    chainId: 84532, // Base Sepolia
    contractAddress: "0xYOUR_CONTRACT_ADDRESS",
    functionSignature: "storeResult(bytes32,uint256,string)",
    params: [input.id, analysis.score, analysis.category],
  });
};

// -- Workflow initialization --
const initWorkflow = (config: Config) => {
  const http = new cre.capabilities.HTTPTrigger();
  return [cre.handler(http.trigger({ method: "POST" }), handler)];
};

export default initWorkflow;
