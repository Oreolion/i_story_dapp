import { ethers } from "hardhat";

/**
 * Verify deployed contract interfaces match expected ABIs.
 * Run after deployment to ensure contracts are properly deployed.
 *
 * Usage: npx hardhat run scripts/verify-deployment.ts --network baseSepolia
 */
async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Verifying deployments with account:", signer.address);
  console.log("---");

  const tokenAddress = process.env.NEXT_PUBLIC_ISTORY_TOKEN_ADDRESS;
  const protocolAddress = process.env.NEXT_PUBLIC_STORY_PROTOCOL_ADDRESS;
  const nftAddress = process.env.NEXT_PUBLIC_STORY_NFT_ADDRESS;

  if (!tokenAddress || !protocolAddress || !nftAddress) {
    console.error("Missing contract addresses in .env");
    console.error("Set NEXT_PUBLIC_ISTORY_TOKEN_ADDRESS, NEXT_PUBLIC_STORY_PROTOCOL_ADDRESS, NEXT_PUBLIC_STORY_NFT_ADDRESS");
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;

  // 1. Verify IStoryToken
  console.log("\n[1/3] Verifying IStoryToken at", tokenAddress);
  try {
    const token = await ethers.getContractAt("IStoryToken", tokenAddress);

    const name = await token.name();
    const symbol = await token.symbol();
    const decimals = await token.decimals();
    const totalSupply = await token.totalSupply();
    const maxSupply = await token.MAX_SUPPLY();

    console.log(`  Name: ${name}`);
    console.log(`  Symbol: ${symbol}`);
    console.log(`  Decimals: ${decimals}`);
    console.log(`  Total Supply: ${ethers.formatEther(totalSupply)}`);
    console.log(`  Max Supply: ${ethers.formatEther(maxSupply)}`);

    if (name !== "iStoryToken") throw new Error(`Expected name 'iStoryToken', got '${name}'`);
    if (symbol !== "ISTORY") throw new Error(`Expected symbol 'ISTORY', got '${symbol}'`);
    if (maxSupply !== ethers.parseEther("100000000")) throw new Error("MAX_SUPPLY mismatch");

    console.log("  ✓ IStoryToken verified successfully");
    passed++;
  } catch (err: any) {
    console.error(`  ✗ IStoryToken verification failed:`, err.message);
    failed++;
  }

  // 2. Verify StoryProtocol
  console.log("\n[2/3] Verifying StoryProtocol at", protocolAddress);
  try {
    const protocol = await ethers.getContractAt("StoryProtocol", protocolAddress);

    // Check contract exists by calling a view function
    const paused = await protocol.paused();
    console.log(`  Paused: ${paused}`);

    console.log("  ✓ StoryProtocol verified successfully");
    passed++;
  } catch (err: any) {
    console.error(`  ✗ StoryProtocol verification failed:`, err.message);
    failed++;
  }

  // 3. Verify StoryNFT
  console.log("\n[3/3] Verifying StoryNFT at", nftAddress);
  try {
    const nft = await ethers.getContractAt("StoryNFT", nftAddress);

    const name = await nft.name();
    const symbol = await nft.symbol();
    const mintFee = await nft.mintFee();

    console.log(`  Name: ${name}`);
    console.log(`  Symbol: ${symbol}`);
    console.log(`  Mint Fee: ${ethers.formatEther(mintFee)} ETH`);

    if (name !== "IStory Collections") throw new Error(`Expected name 'IStory Collections', got '${name}'`);
    if (mintFee < 0) throw new Error("Mint fee not set");

    console.log("  ✓ StoryNFT verified successfully");
    passed++;
  } catch (err: any) {
    console.error(`  ✗ StoryNFT verification failed:`, err.message);
    failed++;
  }

  // Summary
  console.log("\n---");
  console.log(`Verification complete: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
