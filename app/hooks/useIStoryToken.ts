import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { createPublicClient, http, parseEther } from 'viem';
import { sepolia } from 'wagmi/chains';
import iStoryTokenABIJson from '@/lib/abis/iStoryToken.json'; // Update path if needed

const I_STORY_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_ISTORY_TOKEN_ADDRESS as `0x${string}` | undefined;
const RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL as string | undefined;

// Extract ABI array
const iStoryTokenABI = Array.isArray(iStoryTokenABIJson) ? iStoryTokenABIJson : iStoryTokenABIJson.abi || [];
if (!Array.isArray(iStoryTokenABI)) {
  console.error('iStoryTokenABI is not a valid ABI array:', iStoryTokenABI);
}

export function useIStoryToken() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
    // Reads
  const { data: balance } = useReadContract({
    address: I_STORY_TOKEN_ADDRESS,
    abi: iStoryTokenABI,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address },
  });

  if (!I_STORY_TOKEN_ADDRESS || !I_STORY_TOKEN_ADDRESS.startsWith('0x')) {
    console.error('NEXT_PUBLIC_ISTORY_TOKEN_ADDRESS is not defined or invalid in .env.local');
    return null;
  }
  if (!RPC_URL) {
    console.error('NEXT_PUBLIC_SEPOLIA_RPC_URL is not defined in .env.local');
    return null;
  }
  if (!address) {
    return null;
  }
  if (!iStoryTokenABI.length) {
    console.error('iStoryTokenABI is empty or invalid');
    return null;
  }

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(RPC_URL),
  });



  return {
    read: {
      balanceOf: (addr: `0x${string}`) => publicClient.readContract({
        address: I_STORY_TOKEN_ADDRESS,
        abi: iStoryTokenABI,
        functionName: 'balanceOf',
        args: [addr],
      }) as Promise<bigint>,
    },
    write: {
      mint: async (to: `0x${string}`, amount: bigint) => writeContractAsync({
        address: I_STORY_TOKEN_ADDRESS,
        abi: iStoryTokenABI,
        functionName: 'mint',
        args: [to, amount],
      }),
      distributeReward: async (to: `0x${string}`, amount: bigint, reason: string) => writeContractAsync({
        address: I_STORY_TOKEN_ADDRESS,
        abi: iStoryTokenABI,
        functionName: 'distributeReward',
        args: [to, amount, reason],
      }),
      tipCreator: async (creator: `0x${string}`, amount: number, storyId: bigint) => writeContractAsync({
        address: I_STORY_TOKEN_ADDRESS,
        abi: iStoryTokenABI,
        functionName: 'tipCreator',
        args: [creator, parseEther(amount.toString()), storyId],
      }),
      payPaywall: async (creator: `0x${string}`, amount: number, storyId: bigint) => writeContractAsync({
        address: I_STORY_TOKEN_ADDRESS,
        abi: iStoryTokenABI,
        functionName: 'payPaywall',
        args: [creator, parseEther(amount.toString()), storyId],
      }),
      pause: () => writeContractAsync({
        address: I_STORY_TOKEN_ADDRESS,
        abi: iStoryTokenABI,
        functionName: 'pause',
         args: [],
      }),
      unpause: () => writeContractAsync({
        address: I_STORY_TOKEN_ADDRESS,
        abi: iStoryTokenABI,
        functionName: 'unpause',
         args: [],
      }),
    },
    balance: balance as bigint | undefined,
  };
}