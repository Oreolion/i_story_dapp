import { ethers } from "hardhat";

// Chainlink KeystoneForwarder address on Base Sepolia
const BASE_SEPOLIA_FORWARDER = "0x82300bd7c3958625581cc2f77bc6464dcecdf3e5";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying VerifiedMetrics with account:", deployer.address);
  console.log("KeystoneForwarder address:", BASE_SEPOLIA_FORWARDER);

  const VerifiedMetrics = await ethers.getContractFactory("VerifiedMetrics");
  const contract = await VerifiedMetrics.deploy(BASE_SEPOLIA_FORWARDER);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`\nVerifiedMetrics deployed to: ${address}`);

  // Wait for a few confirmations before reading state
  console.log("Waiting for confirmations...");
  const deployTx = contract.deploymentTransaction();
  if (deployTx) {
    await deployTx.wait(2);
  }

  try {
    const forwarder = await contract.getForwarderAddress();
    console.log(`Forwarder address set to: ${forwarder}`);
  } catch {
    console.log("(Could not verify forwarder — contract may still be confirming. This is expected.)")
  }

  console.log("\n--- NEXT STEPS ---");
  console.log("1. Update .env.local: NEXT_PUBLIC_VERIFIED_METRICS_ADDRESS=" + address);
  console.log("2. Update cre/iStory_workflow/config.staging.json verifiedMetricsAddress");
  console.log("3. Verify contract: npx hardhat verify --network baseSepolia " + address + " " + BASE_SEPOLIA_FORWARDER);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
