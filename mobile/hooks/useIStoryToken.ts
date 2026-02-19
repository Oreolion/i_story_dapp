// Hook: ERC20 $STORY token - balance, approve, allowance
import { useReadContract, useWriteContract, useAccount } from "wagmi";
import { parseEther, formatEther } from "viem";
import {
  STORY_TOKEN_ADDRESS,
  STORY_TOKEN_ABI,
  STORY_PROTOCOL_ADDRESS,
} from "../lib/contracts";
import Toast from "react-native-toast-message";

export function useIStoryToken() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const { data: rawBalance } = useReadContract({
    address: STORY_TOKEN_ADDRESS as `0x${string}`,
    abi: STORY_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: rawAllowance } = useReadContract({
    address: STORY_TOKEN_ADDRESS as `0x${string}`,
    abi: STORY_TOKEN_ABI,
    functionName: "allowance",
    args: address ? [address, STORY_PROTOCOL_ADDRESS as `0x${string}`] : undefined,
    query: { enabled: !!address },
  });

  const balance = rawBalance ? formatEther(rawBalance as bigint) : "0";
  const allowance = rawAllowance ? formatEther(rawAllowance as bigint) : "0";

  const approve = async (amount: string) => {
    try {
      const hash = await writeContractAsync({
        address: STORY_TOKEN_ADDRESS as `0x${string}`,
        abi: STORY_TOKEN_ABI,
        functionName: "approve",
        args: [STORY_PROTOCOL_ADDRESS as `0x${string}`, parseEther(amount)],
      });
      Toast.show({ type: "success", text1: "Approval confirmed" });
      return hash;
    } catch (err) {
      console.error("[useIStoryToken] Approve failed:", err);
      Toast.show({ type: "error", text1: "Approval failed" });
      throw err;
    }
  };

  return { balance, allowance, approve, address };
}
