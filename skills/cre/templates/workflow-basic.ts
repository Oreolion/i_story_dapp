/**
 * CRE Basic Workflow Template
 *
 * Pattern: HTTP Trigger → Fetch Data → Transform → On-Chain Write
 *
 * Usage:
 * 1. Copy to cre/src/workflows/your-workflow/index.ts
 * 2. Customize the handler logic
 * 3. Update contract details
 */

import { cre, type Runtime, type NodeRuntime } from "@chainlink/cre-sdk";

type Config = {
  apiUrl: string;
};

type HTTPPayload = {
  body: string;
  headers: Record<string, string>;
};

const handler = (runtime: Runtime<Config>, payload: HTTPPayload) => {
  const input = JSON.parse(payload.body);

  // Fetch external data
  const data = runtime.runInNodeMode((nodeRuntime: NodeRuntime<Config>) => {
    const response = nodeRuntime.httpClient.sendRequest({
      url: `${nodeRuntime.config.apiUrl}/api/data/${input.id}`,
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (response.statusCode !== 200) {
      throw new Error(`Fetch failed: ${response.statusCode}`);
    }

    return JSON.parse(response.body);
  });

  // Transform data (pure computation, no side effects)
  const result = {
    id: data.id,
    value: data.value * 100,
    timestamp: Date.now(),
  };

  // Write to chain
  runtime.evmClient.writeReport({
    chainId: 84532,
    contractAddress: "0xYOUR_CONTRACT_ADDRESS",
    functionSignature: "store(bytes32,uint256,uint256)",
    params: [result.id, result.value, result.timestamp],
  });
};

const initWorkflow = (config: Config) => {
  const http = new cre.capabilities.HTTPTrigger();
  return [cre.handler(http.trigger({ method: "POST" }), handler)];
};

export default initWorkflow;
