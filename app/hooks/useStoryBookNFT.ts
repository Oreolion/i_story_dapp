import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'wagmi/chains';
import StoryBookNFT from '@/lib/abis/StoryBookNFT.json';

const STORYBOOK_NFT_ADDRESS = process.env.NEXT_PUBLIC_STORYBOOK_NFT_ADDRESS as `0x${string}` | undefined;
const RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL as string | undefined;

const storybookNFTABI = Array.isArray(StoryBookNFT) ? StoryBookNFT : StoryBookNFT.abi || [];
if (!Array.isArray(storybookNFTABI)) {
  console.error('storybookNFTABI is not a valid ABI array:', storybookNFTABI);
}

export function useStorybookNFT() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  // Hook at top with enabled guard (from previous fix)
  const { data: balanceOfRaw } = useReadContract({
    address: STORYBOOK_NFT_ADDRESS!, // Fixed: Non-null assertion after validation
    abi: storybookNFTABI,
    functionName: 'balanceOf',
    args: [address!],
    query: {
      enabled: !!address && !!STORYBOOK_NFT_ADDRESS && !!STORYBOOK_NFT_ADDRESS.startsWith('0x') && !!storybookNFTABI.length,
    },
  });

  // Early returns (unchanged)
  if (!STORYBOOK_NFT_ADDRESS || !STORYBOOK_NFT_ADDRESS.startsWith('0x')) {
    console.error('NEXT_PUBLIC_STORYBOOK_NFT_ADDRESS is not defined or invalid in .env.local');
    return null;
  }
  if (!RPC_URL) {
    console.error('NEXT_PUBLIC_SEPOLIA_RPC_URL is not defined in .env.local');
    return null;
  }
  if (!address) {
    return null;
  }
  if (!storybookNFTABI.length) {
    console.error('storybookNFTABI is empty or invalid');
    return null;
  }

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(RPC_URL),
  });

  return {
    read: {
      balanceOf: (owner: `0x${string}`) => publicClient.readContract({
        address: STORYBOOK_NFT_ADDRESS!, // Fixed here too
        abi: storybookNFTABI,
        functionName: 'balanceOf',
        args: [owner],
      }) as Promise<bigint>,
      ownerOf: (tokenId: bigint) => publicClient.readContract({
        address: STORYBOOK_NFT_ADDRESS!,
        abi: storybookNFTABI,
        functionName: 'ownerOf',
        args: [tokenId],
      }) as Promise<`0x${string}`>,
      paywallAmounts: (tokenId: bigint) => publicClient.readContract({
        address: STORYBOOK_NFT_ADDRESS!,
        abi: storybookNFTABI,
        functionName: 'paywallAmounts',
        args: [tokenId],
      }) as Promise<bigint>,
      getPaywall: (tokenId: bigint) => publicClient.readContract({
        address: STORYBOOK_NFT_ADDRESS!,
        abi: storybookNFTABI,
        functionName: 'getPaywall',
        args: [tokenId],
      }) as Promise<bigint>,
      royaltyInfo: (tokenId: bigint, salePrice: bigint) => publicClient.readContract({
        address: STORYBOOK_NFT_ADDRESS!,
        abi: storybookNFTABI,
        functionName: 'royaltyInfo',
        args: [tokenId, salePrice],
      }) as Promise<[ `0x${string}`, bigint ]>,
      tokenURI: (tokenId: bigint) => publicClient.readContract({
        address: STORYBOOK_NFT_ADDRESS!,
        abi: storybookNFTABI,
        functionName: 'tokenURI',
        args: [tokenId],
      }) as Promise<string>,
      whitelistedContracts: (contractAddress: `0x${string}`) => publicClient.readContract({
        address: STORYBOOK_NFT_ADDRESS!,
        abi: storybookNFTABI,
        functionName: 'whitelistedContracts',
        args: [contractAddress],
      }) as Promise<boolean>,
    },
    write: {
      mintJournal: async (to: `0x${string}`, uri: string, paywallAmount: bigint) => writeContractAsync({
        address: STORYBOOK_NFT_ADDRESS!,
        abi: storybookNFTABI,
        functionName: 'mintJournal',
        args: [to, uri, paywallAmount],
      }),
      setPaywall: async (tokenId: bigint, amount: bigint) => writeContractAsync({
        address: STORYBOOK_NFT_ADDRESS!,
        abi: storybookNFTABI,
        functionName: 'setPaywall',
        args: [tokenId, amount],
      }),
      setWhitelist: async (contractAddress: `0x${string}`, allowed: boolean) => writeContractAsync({
        address: STORYBOOK_NFT_ADDRESS!,
        abi: storybookNFTABI,
        functionName: 'setWhitelist',
        args: [contractAddress, allowed],
      }),
      setRoyalty: async (receiver: `0x${string}`, bps: number) => writeContractAsync({
        address: STORYBOOK_NFT_ADDRESS!,
        abi: storybookNFTABI,
        functionName: 'setRoyalty',
        args: [receiver, bps],
      }),
      pause: () => writeContractAsync({
        address: STORYBOOK_NFT_ADDRESS!,
        abi: storybookNFTABI,
        functionName: 'pause',
        args: [],
      }),
      unpause: () => writeContractAsync({
        address: STORYBOOK_NFT_ADDRESS!,
        abi: storybookNFTABI,
        functionName: 'unpause',
        args: [],
      }),
    },
    balanceOf: balanceOfRaw as bigint | undefined,
  };
}