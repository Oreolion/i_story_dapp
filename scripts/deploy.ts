import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy IStoryToken
  // Argument: Initial Admin (You)
  const IStoryToken = await ethers.getContractFactory("IStoryToken");
  const token = await IStoryToken.deploy(deployer.address);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log(`IStoryToken deployed to: ${tokenAddress}`);

  // 2. Deploy StoryProtocol
  // Arguments: Token Address, Initial Admin (You)
  const StoryProtocol = await ethers.getContractFactory("StoryProtocol");
  const protocol = await StoryProtocol.deploy(tokenAddress, deployer.address);
  await protocol.waitForDeployment();
  const protocolAddress = await protocol.getAddress();
  console.log(`StoryProtocol deployed to: ${protocolAddress}`);

  // 3. Deploy StoryNFT
  // Argument: Initial Admin (You)
  const StoryNFT = await ethers.getContractFactory("StoryNFT");
  const nft = await StoryNFT.deploy(deployer.address);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log(`StoryNFT deployed to: ${nftAddress}`);

  console.log("\n--- SAVE THESE ADDRESSES ---");
  console.log("Go to 'lib/contracts.ts' and update the addresses now.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});