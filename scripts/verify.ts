import { run } from "hardhat";
import * as dotenv from "dotenv";

// Load env vars from .env.local
dotenv.config({ path: ".env.local" });

async function main() {
  // 1. CONFIGURATION FROM ENV
  const ADMIN_WALLET = process.env.NEXT_PUBLIC_INITIAL_ADMIN_ADDRESS;
  const TOKEN_ADDR = process.env.NEXT_PUBLIC_ISTORY_TOKEN_ADDRESS;
  const PROTOCOL_ADDR = process.env.NEXT_PUBLIC_STORY_PROTOCOL_ADDRESS;
  const NFT_ADDR = process.env.NEXT_PUBLIC_STORY_NFT_ADDRESS;

  // Check if env vars are loaded
  if (!ADMIN_WALLET || !TOKEN_ADDR || !PROTOCOL_ADDR || !NFT_ADDR) {
    console.error("❌ Missing environment variables.");
    console.error("Please ensure .env.local has: ADMIN_WALLET_ADDRESS, NEXT_PUBLIC_ISTORY_TOKEN_ADDRESS, NEXT_PUBLIC_STORY_PROTOCOL_ADDRESS, NEXT_PUBLIC_STORY_NFT_ADDRESS");
    process.exit(1);
  }

  console.log("Starting verification on Base Sepolia...");
  console.log(`Admin: ${ADMIN_WALLET}`);

  // 2. VERIFY TOKEN
  console.log(`\nVerifying IStoryToken at ${TOKEN_ADDR}...`);
  try {
    await run("verify:verify", {
      address: TOKEN_ADDR,
      constructorArguments: [ADMIN_WALLET],
    });
  } catch (e: any) {
    console.log(`Token Verification Error: ${e.message}`);
  }

  // 3. VERIFY PROTOCOL
  // Constructor: (address _tokenAddress, address initialAdmin)
  console.log(`\nVerifying StoryProtocol at ${PROTOCOL_ADDR}...`);
  try {
    await run("verify:verify", {
      address: PROTOCOL_ADDR,
      constructorArguments: [TOKEN_ADDR, ADMIN_WALLET],
    });
  } catch (e: any) {
    console.log(`Protocol Verification Error: ${e.message}`);
  }

  // 4. VERIFY NFT
  // Constructor: (address defaultAdmin)
  console.log(`\nVerifying StoryNFT at ${NFT_ADDR}...`);
  try {
    await run("verify:verify", {
      address: NFT_ADDR,
      constructorArguments: [ADMIN_WALLET],
    });
  } catch (e: any) {
    console.log(`NFT Verification Error: ${e.message}`);
  }

  console.log("\nVerification attempts complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});