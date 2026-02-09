/**
 * HTTP Trigger Handler — Story Verification
 *
 * Flow:
 * 1. Decode the HTTP trigger payload (story content)
 * 2. Query Gemini AI for analysis (via HTTPClient consensus)
 * 3. Encode metrics for on-chain storage
 * 4. Generate a signed CRE report
 * 5. Write the report to the VerifiedMetrics contract
 */

import {
  cre,
  type Runtime,
  type HTTPPayload,
  getNetwork,
  hexToBase64,
  TxStatus,
  bytesToHex,
  decodeJson,
} from "@chainlink/cre-sdk";
import { encodeAbiParameters, parseAbiParameters } from "viem";
import { askGemini } from "./gemini";
import type { Config } from "./main";

// Trigger input — content included directly in the payload
interface TriggerInput {
  storyId: string;
  title: string;
  content: string;
  authorWallet: string;
}

// ABI parameters matching VerifiedMetrics.storeVerifiedMetrics
const STORE_METRICS_PARAMS = parseAbiParameters(
  "bytes32 storyId, address author, uint8 significanceScore, uint8 emotionalDepth, uint8 qualityScore, uint32 wordCount, string[] themes, bytes32 attestationId"
);

/**
 * Main HTTP trigger handler
 */
export function onHttpTrigger(
  runtime: Runtime<Config>,
  payload: HTTPPayload
): string {
  runtime.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  runtime.log("CRE Workflow: iStory Story Verification");
  runtime.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    // ─────────────────────────────────────────────────────────────
    // Step 1: Parse and validate the incoming payload
    // ─────────────────────────────────────────────────────────────
    if (!payload.input || payload.input.length === 0) {
      runtime.log("[ERROR] Empty request payload");
      return "Error: Empty request";
    }

    const input = decodeJson(payload.input) as TriggerInput;
    runtime.log(`[Step 1] Processing story: ${input.storyId}`);

    if (!input.storyId || !input.content || !input.authorWallet) {
      runtime.log("[ERROR] Missing required fields");
      return "Error: Missing storyId, content, or authorWallet";
    }

    // ─────────────────────────────────────────────────────────────
    // Step 2: AI Analysis via Gemini
    // ─────────────────────────────────────────────────────────────
    runtime.log("[Step 2] Querying Gemini AI for story analysis...");

    let metrics;
    try {
      metrics = askGemini(runtime, input.title || "Untitled", input.content);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      runtime.log(`[Step 2] Gemini error: ${msg}`);
      throw err;
    }

    runtime.log(
      `[Step 2] Results: significance=${metrics.significanceScore}, depth=${metrics.emotionalDepth}, quality=${metrics.qualityScore}, words=${metrics.wordCount}`
    );
    runtime.log(`[Step 2] Themes: ${metrics.themes.join(", ")}`);

    // ─────────────────────────────────────────────────────────────
    // Step 3: Get network and create EVM client
    // ─────────────────────────────────────────────────────────────
    const evmConfig = runtime.config.evms[0];

    const network = getNetwork({
      chainFamily: "evm",
      chainSelectorName: evmConfig.chainSelectorName,
      isTestnet: true,
    });

    if (!network) {
      throw new Error(`Unknown chain: ${evmConfig.chainSelectorName}`);
    }

    runtime.log(`[Step 3] Target chain: ${evmConfig.chainSelectorName}`);
    runtime.log(`[Step 3] Contract: ${evmConfig.verifiedMetricsAddress}`);

    const evmClient = new cre.capabilities.EVMClient(
      network.chainSelector.selector
    );

    // ─────────────────────────────────────────────────────────────
    // Step 4: Encode metrics for on-chain storage
    // ─────────────────────────────────────────────────────────────
    runtime.log("[Step 4] Encoding metrics data...");

    // Convert UUID to bytes32 (remove dashes, pad to 64 hex chars)
    const storyIdBytes32 = `0x${input.storyId
      .replace(/-/g, "")
      .padEnd(64, "0")}` as `0x${string}`;

    const reportData = encodeAbiParameters(STORE_METRICS_PARAMS, [
      storyIdBytes32,
      input.authorWallet as `0x${string}`,
      metrics.significanceScore,
      metrics.emotionalDepth,
      metrics.qualityScore,
      metrics.wordCount,
      metrics.themes,
      storyIdBytes32, // attestation ID
    ]);

    // ─────────────────────────────────────────────────────────────
    // Step 5: Generate signed CRE report
    // ─────────────────────────────────────────────────────────────
    runtime.log("[Step 5] Generating CRE report...");

    const reportResponse = runtime
      .report({
        encodedPayload: hexToBase64(reportData),
        encoderName: "evm",
        signingAlgo: "ecdsa",
        hashingAlgo: "keccak256",
      })
      .result();

    // ─────────────────────────────────────────────────────────────
    // Step 6: Write the report to the smart contract
    // ─────────────────────────────────────────────────────────────
    runtime.log(
      `[Step 6] Writing to contract: ${evmConfig.verifiedMetricsAddress}`
    );

    const writeResult = evmClient
      .writeReport(runtime, {
        receiver: evmConfig.verifiedMetricsAddress,
        report: reportResponse,
        gasConfig: {
          gasLimit: evmConfig.gasLimit,
        },
      })
      .result();

    // ─────────────────────────────────────────────────────────────
    // Step 7: Check result and return
    // ─────────────────────────────────────────────────────────────
    if (writeResult.txStatus === TxStatus.SUCCESS) {
      const txHash = bytesToHex(writeResult.txHash || new Uint8Array(32));
      runtime.log(`[Step 7] Verification successful: ${txHash}`);
      runtime.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      );
      return txHash;
    }

    throw new Error(`Transaction failed with status: ${writeResult.txStatus}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    runtime.log(`[ERROR] ${msg}`);
    runtime.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );
    throw err;
  }
}
