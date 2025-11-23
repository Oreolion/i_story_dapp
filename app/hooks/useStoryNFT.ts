"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { STORY_NFT_ADDRESS, STORY_NFT_ABI } from "@/lib/contracts";
import { toast } from "react-hot-toast";
import { useEffect } from "react";

export function useStoryNFT() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  // Mint a Book/Collection
  // The URI should be an IPFS hash containing the book metadata (JSON)
  const mintBook = async (ipfsUri: string) => {
    try {
      writeContract({
        address: STORY_NFT_ADDRESS,
        abi: STORY_NFT_ABI,
        functionName: "mintBook",
        args: [ipfsUri],
      });
      toast.loading("Minting your book...", { id: "nft-toast" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to mint book");
    }
  };

  // Transaction Feedback
  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({ 
    hash 
  });

  useEffect(() => {
    if (isConfirmed) {
      toast.success("Book minted successfully!", { id: "nft-toast" });
    }
  }, [isConfirmed]);

  return {
    mintBook,
    isPending,
    hash
  };
}