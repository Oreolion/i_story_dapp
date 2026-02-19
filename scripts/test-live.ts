import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
  // 1. SETUP
  const [deployer] = await ethers.getSigners();
  console.log(`\n🧪 Starting Live Test on Base Sepolia`);
  console.log(`👤 Actor: ${deployer.address}`);

  const TOKEN_ADDR = process.env.NEXT_PUBLIC_ESTORY_TOKEN_ADDRESS;
  const PROTOCOL_ADDR = process.env.NEXT_PUBLIC_STORY_PROTOCOL_ADDRESS;
  const NFT_ADDR = process.env.NEXT_PUBLIC_STORY_NFT_ADDRESS;

  if (!TOKEN_ADDR || !PROTOCOL_ADDR || !NFT_ADDR) {
    throw new Error("❌ Missing contract addresses in .env.local");
  }

  // Attach to Contracts
  const Token = await ethers.getContractAt("EStoryToken", TOKEN_ADDR);
  const Protocol = await ethers.getContractAt("StoryProtocol", PROTOCOL_ADDR);
  const NFT = await ethers.getContractAt("StoryNFT", NFT_ADDR);

  // --- TEST 1: TOKEN MINTING ---
  console.log(`\n[1] Testing Token...`);
  try {
    const amount = ethers.parseEther("100"); // 100 $ESTORY
    // Note: This only works if 'deployer' has MINTER_ROLE. 
    // If you are the admin, this should work.
    const tx = await Token.mint(deployer.address, amount);
    await tx.wait();
    console.log(`✅ Minted 100 $ESTORY to self`);
    
    const balance = await Token.balanceOf(deployer.address);
    console.log(`💰 New Balance: ${ethers.formatEther(balance)} $ESTORY`);
  } catch (e: any) {
    console.log(`❌ Minting failed (You might not be minter, or role setup is wrong): ${e.message}`);
  }

  // --- TEST 2: APPROVAL ---
  console.log(`\n[2] Testing Approval...`);
  try {
    const approveAmount = ethers.parseEther("50");
    const tx = await Token.approve(PROTOCOL_ADDR, approveAmount);
    console.log(`⏳ Approving Protocol to spend 50 $ESTORY...`);
    await tx.wait();
    
    const allowance = await Token.allowance(deployer.address, PROTOCOL_ADDR);
    console.log(`✅ Allowance set: ${ethers.formatEther(allowance)} $ESTORY`);
  } catch (e: any) {
    console.log(`❌ Approval failed: ${e.message}`);
  }

  // --- TEST 3: TIPPING (PROTOCOL) ---
  console.log(`\n[3] Testing Tipping Logic...`);
  try {
    // Sending to a random address (or yourself)
    const recipient = "0x000000000000000000000000000000000000dEaD"; // Burn address for test
    const tipAmount = ethers.parseEther("10");
    const storyId = 999; // Mock ID

    const tx = await Protocol.tipCreator(recipient, tipAmount, storyId);
    console.log(`⏳ Sending Tip of 10 $ESTORY...`);
    await tx.wait();
    console.log(`✅ Tip Success!`);
  } catch (e: any) {
    console.log(`❌ Tipping failed: ${e.message}`);
  }

  // --- TEST 4: MINTING NFT ---
  console.log(`\n[4] Testing NFT Minting...`);
  try {
    const mockURI = "ipfs://QmTest123";
    const tx = await NFT.mintBook(mockURI);
    console.log(`⏳ Minting Book NFT...`);
    await tx.wait();
    console.log(`✅ NFT Minted Successfully!`);
  } catch (e: any) {
    console.log(`❌ NFT Mint failed: ${e.message}`);
  }

  console.log("\n🎉 Live Test Complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});