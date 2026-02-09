/**
 * CRE Basic Workflow Template
 *
 * Pattern: HTTP Trigger → Transform Data → On-Chain Write
 * No AI analysis — just receive data, encode, and write on-chain.
 *
 * Usage:
 *   1. Copy to cre/<workflow-name>/main.ts
 *   2. Customize TriggerInput and ABI parameters
 *   3. Create config.staging.json with contract address + chain
 *   4. Run: cre workflow simulate <workflow-name>
 */

import {
  cre,
  Runner,
  type Runtime,
  type HTTPPayload,
  getNetwork,
  hexToBase64,
  TxStatus,
  bytesToHex,
  decodeJson,
} from "@chainlink/cre-sdk";
import { encodeAbiParameters, parseAbiParameters } from "viem";

// ─── Config ──────────────────────────────────────────────────────────

export type Config = {
  evms: Array<{
    contractAddress: string;
    chainSelectorName: string;
    gasLimit: string;
  }>;
};

// ─── Trigger Input ───────────────────────────────────────────────────

interface TriggerInput {
  id: string;
  value: number;
}

// ─── ABI Parameters (must match contract's _processReport decode) ────

const STORE_PARAMS = parseAbiParameters("bytes32 dataId, uint256 value");

// ─── Handler ─────────────────────────────────────────────────────────

function onHttpTrigger(
  runtime: Runtime<Config>,
  payload: HTTPPayload
): string {
  // Parse trigger input
  const input = decodeJson(payload.input) as TriggerInput;
  runtime.log(`Processing: ${input.id}`);

  // Get EVM client
  const evmConfig = runtime.config.evms[0];
  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: evmConfig.chainSelectorName,
    isTestnet: true,
  });

  if (!network) throw new Error(`Unknown chain: ${evmConfig.chainSelectorName}`);

  const evmClient = new cre.capabilities.EVMClient(
    network.chainSelector.selector
  );

  // Encode data
  const idBytes32 = `0x${input.id.replace(/-/g, "").padEnd(64, "0")}` as `0x${string}`;
  const reportData = encodeAbiParameters(STORE_PARAMS, [
    idBytes32,
    BigInt(input.value),
  ]);

  // Sign report
  const reportResponse = runtime
    .report({
      encodedPayload: hexToBase64(reportData),
      encoderName: "evm",
      signingAlgo: "ecdsa",
      hashingAlgo: "keccak256",
    })
    .result();

  // Write to chain
  const writeResult = evmClient
    .writeReport(runtime, {
      receiver: evmConfig.contractAddress,
      report: reportResponse,
      gasConfig: { gasLimit: evmConfig.gasLimit },
    })
    .result();

  if (writeResult.txStatus === TxStatus.SUCCESS) {
    return bytesToHex(writeResult.txHash || new Uint8Array(32));
  }

  throw new Error(`Transaction failed: ${writeResult.txStatus}`);
}

// ─── Entry Point ─────────────────────────────────────────────────────

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
