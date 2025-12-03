// import { add } from "date-fns";

// Replace these with your deployed address from Hardhat/Remix
export const STORY_TOKEN_ADDRESS = "0xf9eDD76B55F58Bf4E8Ae2A90a1D6d8d44dfA74BC"; 
export const STORY_PROTOCOL_ADDRESS = "0xA51a4cA00cC4C81A5F7cB916D0BFa1a4aD6f4a71";
export const STORY_NFT_ADDRESS = "0x6D37ebc5eAEF37ecC888689f295D114187933342";

// 1. IStoryToken ABI (ERC20 + Burnable)
export const STORY_TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
] as const;

// 2. StoryProtocol ABI (Tipping & Paywalls)
export const STORY_PROTOCOL_ABI = [
  "function tipCreator(address creator, uint256 amount, uint256 storyId)",
  "function payPaywall(address author, uint256 amount, uint256 contentId)",
  "event TipSent(address indexed from, address indexed to, uint256 amount, uint256 indexed storyId)",
  "event ContentUnlocked(address indexed payer, address indexed author, uint256 amount, uint256 indexed contentId)"
] as const;

// 3. StoryNFT ABI (Minting)
export const STORY_NFT_ABI = [
  "function mintBook(string memory uri)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "event NFTMinted(uint256 indexed tokenId, address indexed recipient, string uri, string collectionType)"
] as const;