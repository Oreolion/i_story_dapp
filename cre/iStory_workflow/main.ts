/**
 * iStory CRE Workflow: Story Verification
 *
 * Flow: HTTP Trigger (with content) → AI Analysis (Gemini) → Write On-Chain
 *
 * Based on Chainlink CRE prediction market bootcamp patterns.
 */

import { cre, Runner } from "@chainlink/cre-sdk";
import { onHttpTrigger } from "./httpCallback";

// Config type — matches config.staging.json structure
export type Config = {
  geminiModel: string;
  evms: Array<{
    verifiedMetricsAddress: string;
    chainSelectorName: string;
    gasLimit: string;
  }>;
};

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
