/**
 * CRE AI Workflow Template
 *
 * Pattern: HTTP Trigger → AI Analysis (Gemini via HTTPClient consensus) → On-Chain Write
 *
 * This is the CORRECT CRE SDK pattern, tested and verified.
 *
 * Key SDK types:
 *   - cre.capabilities.HTTPCapability  (NOT HTTPTrigger — that doesn't exist)
 *   - cre.capabilities.HTTPClient      (outbound HTTP with DON consensus)
 *   - cre.capabilities.EVMClient       (on-chain reads/writes)
 *   - type HTTPPayload                 (trigger input: { input: Uint8Array })
 *   - decodeJson(payload.input)        (decode trigger payload)
 *   - runtime.getSecret({ id: "..." }) (access CRE-managed secrets)
 *   - runtime.report()                 (generate signed CRE report)
 *   - getNetwork()                     (resolve chain selector)
 *
 * Usage:
 *   1. Copy to cre/<workflow-name>/main.ts
 *   2. Create gemini.ts with HTTPClient consensus pattern
 *   3. Create httpCallback.ts with handler logic
 *   4. Create config.staging.json with your chain + contract config
 *   5. Run: cre workflow simulate <workflow-name>
 *   6. Deploy: cre workflow deploy <workflow-name>
 */

import {
  cre,
  Runner,
  type Runtime,
  type HTTPPayload,
  type HTTPSendRequester,
  getNetwork,
  hexToBase64,
  TxStatus,
  bytesToHex,
  decodeJson,
  consensusIdenticalAggregation,
} from "@chainlink/cre-sdk";
import { encodeAbiParameters, parseAbiParameters } from "viem";

// ─── Config: matches config.staging.json / config.production.json ────

export type Config = {
  geminiModel: string;
  evms: Array<{
    contractAddress: string;
    chainSelectorName: string;
    gasLimit: string;
  }>;
};

// ─── Trigger Input ───────────────────────────────────────────────────

interface TriggerInput {
  id: string;
  content: string;
  // Add your fields here
}

// ─── AI Analysis via Gemini (HTTPClient with consensus) ──────────────

interface AnalysisResult {
  score: number;
  category: string;
  themes: string[];
}

function analyzeWithAI(
  runtime: Runtime<Config>,
  content: string
): AnalysisResult {
  const geminiApiKey = runtime.getSecret({ id: "GEMINI_API_KEY" }).result();
  const httpClient = new cre.capabilities.HTTPClient();

  const result = httpClient
    .sendRequest(
      runtime,
      buildGeminiRequest(content, geminiApiKey.value),
      consensusIdenticalAggregation<AnalysisResult>()
    )(runtime.config)
    .result();

  return result;
}

const buildGeminiRequest =
  (content: string, apiKey: string) =>
  (
    sendRequester: HTTPSendRequester,
    config: Config
  ): AnalysisResult => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent?key=${apiKey}`;

    const requestData = {
      contents: [
        {
          parts: [
            {
              text: `Analyze this content and return JSON with: score (0-100), category (string), themes (string[]). Content: "${content}"`,
            },
          ],
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
        url,
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
      })
      .result();

    const bodyText = new TextDecoder().decode(resp.body);
    const parsed = JSON.parse(bodyText);
    const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    return JSON.parse(text) as AnalysisResult;
  };

// ─── ABI Parameters (must match your contract's _processReport decode) ─

const STORE_PARAMS = parseAbiParameters(
  "bytes32 dataId, uint256 score, string category"
);

// ─── HTTP Trigger Handler ────────────────────────────────────────────

function onHttpTrigger(
  runtime: Runtime<Config>,
  payload: HTTPPayload
): string {
  // Step 1: Parse input (decodeJson handles Uint8Array → object)
  const input = decodeJson(payload.input) as TriggerInput;
  runtime.log(`Processing: ${input.id}`);

  // Step 2: AI Analysis via HTTPClient consensus
  const analysis = analyzeWithAI(runtime, input.content);
  runtime.log(`Score: ${analysis.score}, Category: ${analysis.category}`);

  // Step 3: Get network and EVM client
  const evmConfig = runtime.config.evms[0];
  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: evmConfig.chainSelectorName,
    isTestnet: true,
  });

  if (!network) {
    throw new Error(`Unknown chain: ${evmConfig.chainSelectorName}`);
  }

  const evmClient = new cre.capabilities.EVMClient(
    network.chainSelector.selector
  );

  // Step 4: Encode ABI data
  const idBytes32 = `0x${input.id.replace(/-/g, "").padEnd(64, "0")}` as `0x${string}`;
  const reportData = encodeAbiParameters(STORE_PARAMS, [
    idBytes32,
    BigInt(analysis.score),
    analysis.category,
  ]);

  // Step 5: Generate signed CRE report
  const reportResponse = runtime
    .report({
      encodedPayload: hexToBase64(reportData),
      encoderName: "evm",
      signingAlgo: "ecdsa",
      hashingAlgo: "keccak256",
    })
    .result();

  // Step 6: Write report to contract via KeystoneForwarder
  const writeResult = evmClient
    .writeReport(runtime, {
      receiver: evmConfig.contractAddress,
      report: reportResponse,
      gasConfig: {
        gasLimit: evmConfig.gasLimit,
      },
    })
    .result();

  // Step 7: Check result
  if (writeResult.txStatus === TxStatus.SUCCESS) {
    const txHash = bytesToHex(writeResult.txHash || new Uint8Array(32));
    runtime.log(`Success: ${txHash}`);
    return txHash;
  }

  throw new Error(`Transaction failed: ${writeResult.txStatus}`);
}

// ─── Workflow Entry Point ────────────────────────────────────────────

const initWorkflow = (config: Config) => {
  const httpCapability = new cre.capabilities.HTTPCapability();
  const httpTrigger = httpCapability.trigger({});
  return [cre.handler(httpTrigger, onHttpTrigger)];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}

main();
