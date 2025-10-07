// lib/web3.ts
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import StoryBookNFTABI  from '@/lib/abis/StoryBookNFT.json';
import  likeSystemABI  from '@/lib/abis/LikeSystem.json';

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http('https://rpc.sepolia.org'),
});

export interface JournalNFT {
  tokenId: bigint;
  owner: `0x${string}`;
  title: string;
  contentHash: string;
  timestamp: bigint;
  likes: bigint;
}

export class Web3Service {
  private static instance: Web3Service;
  static getInstance(): Web3Service {
    if (!Web3Service.instance) Web3Service.instance = new Web3Service();
    return Web3Service.instance;
  }

  async mintJournalNFT(to: `0x${string}`, uri: string, contractAddress: `0x${string}`): Promise<bigint | null> {
    // Use useWriteContract in components; this for backend (sign with server wallet)
    try {
      // Simulate; in prod, use walletClient.writeContract
      return await publicClient.writeContract({
        address: contractAddress,
        abi: journalNFTABI,
        functionName: 'mintJournal',
        args: [to, uri],
      }) as bigint;
    } catch (error) {
      console.error('Mint error:', error);
      return null;
    }
  }

  async getUserNFTs(owner: `0x${string}`, contractAddress: `0x${string}`): Promise<JournalNFT[]> {
    // Fetch via events or subgraph; mock for now, replace with real query
    const nfts: JournalNFT[] = []; // Use publicClient.getLogs for Transfer events
    return nfts;
  }

  async likeStory(tokenId: bigint, user: `0x${string}`, contractAddress: `0x${string}`): Promise<boolean> {
    try {
      // useWriteContract in UI
      await publicClient.writeContract({
        address: contractAddress,
        abi: likeSystemABI,
        functionName: 'likeStory',
        args: [tokenId, user],
      });
      return true;
    } catch (error) {
      console.error('Like error:', error);
      return false;
    }
  }

  async getStoryTokenBalance(address: `0x${string}`, tokenAddress: `0x${string}`): Promise<bigint> {
    const [data] = await publicClient.readContract({
      address: tokenAddress,
      abi: storyTokenABI,
      functionName: 'balanceOf',
      args: [address],
    });
    return data as bigint;
  }
}

export const web3Service = Web3Service.getInstance();