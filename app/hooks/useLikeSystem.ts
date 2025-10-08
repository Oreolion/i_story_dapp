import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'wagmi/chains';
import likeSystemABIJson from '@/lib/abis/LikeSystem.json';

const LIKE_SYSTEM_ADDRESS = process.env.NEXT_PUBLIC_LIKE_SYSTEM_ADDRESS as `0x${string}` | undefined;
const RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL as string | undefined;

const likeSystemABI = Array.isArray(likeSystemABIJson) ? likeSystemABIJson : likeSystemABIJson.abi || [];
if (!Array.isArray(likeSystemABI)) {
  console.error('likeSystemABI is not a valid ABI array:', likeSystemABI);
}

export function useLikeSystem() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  // Hook at top with enabled guard (prevents conditional call)
  const { data: storyTokenRaw } = useReadContract({
    address: LIKE_SYSTEM_ADDRESS!, // Fixed: Non-null assertion after validation
    abi: likeSystemABI,
    functionName: 'storyToken',
    query: {
      enabled: !!address && !!LIKE_SYSTEM_ADDRESS && !!LIKE_SYSTEM_ADDRESS.startsWith('0x') && !!likeSystemABI.length,
    },
  });

  // Early returns after all hooks
  if (!LIKE_SYSTEM_ADDRESS || !LIKE_SYSTEM_ADDRESS.startsWith('0x')) {
    console.error('NEXT_PUBLIC_LIKE_SYSTEM_ADDRESS is not defined or invalid in .env.local');
    return null;
  }
  if (!RPC_URL) {
    console.error('NEXT_PUBLIC_SEPOLIA_RPC_URL is not defined in .env.local');
    return null;
  }
  if (!address) {
    return null;
  }
  if (!likeSystemABI.length) {
    console.error('likeSystemABI is empty or invalid');
    return null;
  }

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(RPC_URL),
  });

  return {
    read: {
      storyToken: () => publicClient.readContract({
        address: LIKE_SYSTEM_ADDRESS!, 
        abi: likeSystemABI,
        functionName: 'storyToken',
        args: [],
      }) as Promise<`0x${string}`>,
      storyLikes: (tokenId: bigint) => publicClient.readContract({
        address: LIKE_SYSTEM_ADDRESS!,
        abi: likeSystemABI,
        functionName: 'storyLikes',
        args: [tokenId],
      }) as Promise<bigint>,
      hasLiked: (liker: `0x${string}`, tokenId: bigint) => publicClient.readContract({
        address: LIKE_SYSTEM_ADDRESS!,
        abi: likeSystemABI,
        functionName: 'hasLiked',
        args: [liker, tokenId],
      }) as Promise<boolean>,
      getLikes: (tokenId: bigint) => publicClient.readContract({
        address: LIKE_SYSTEM_ADDRESS!,
        abi: likeSystemABI,
        functionName: 'getLikes',
        args: [tokenId],
      }) as Promise<bigint>,
    },
    write: {
      likeStory: async (tokenId: bigint, liker: `0x${string}`) => writeContractAsync({
        address: LIKE_SYSTEM_ADDRESS!,
        abi: likeSystemABI,
        functionName: 'likeStory',
        args: [tokenId, liker],
      }),
      pause: () => writeContractAsync({
        address: LIKE_SYSTEM_ADDRESS!,
        abi: likeSystemABI,
        functionName: 'pause',
        args: [],
      }),
      unpause: () => writeContractAsync({
        address: LIKE_SYSTEM_ADDRESS!,
        abi: likeSystemABI,
        functionName: 'unpause',
        args: [],
      }),
    },
    storyToken: storyTokenRaw as `0x${string}` | undefined,
  };
}