"use client";

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
import { STORY_TOKEN_ADDRESS, STORY_TOKEN_ABI, STORY_PROTOCOL_ADDRESS } from "@/lib/contracts";
import { toast } from "react-hot-toast";

export function useIStoryToken() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();

  // 1. Read Balance
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: STORY_TOKEN_ADDRESS,
    abi: STORY_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address }, // Only run if address exists
  });

  // 2. Read Allowance (Check if Protocol is allowed to spend)
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: STORY_TOKEN_ADDRESS,
    abi: STORY_TOKEN_ABI,
    functionName: "allowance",
    args: address ? [address, STORY_PROTOCOL_ADDRESS] : undefined,
    query: { enabled: !!address },
  });

  // 3. Approve Protocol (Call this before Tipping/Unlocking)
  const approveProtocol = async (amount: string) => {
    try {
      writeContract({
        address: STORY_TOKEN_ADDRESS,
        abi: STORY_TOKEN_ABI,
        functionName: "approve",
        args: [STORY_PROTOCOL_ADDRESS, parseEther(amount)],
      });
      toast.loading("Approving tokens...", { id: "approve-toast" });
    } catch (error) {
      console.error("Approval error:", error);
      toast.error("Approval failed");
    }
  };

  // Wait for transaction
  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({ 
    hash, 
  });

  if (isConfirmed) {
    toast.success("Approval successful!", { id: "approve-toast" });
    refetchAllowance(); // Update state
  }

  return {
    balance: balance ? BigInt(balance) : BigInt(0),
    formattedBalance: balance ? formatEther(balance) : "0",
    allowance: allowance ? BigInt(allowance) : BigInt(0),
    approve: approveProtocol,
    isPending,
    refetchBalance,
  };
}