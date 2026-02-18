// Hook: Tips & paywall via StoryProtocol contract
import { useWriteContract, useAccount } from "wagmi";
import { parseEther } from "viem";
import { STORY_PROTOCOL_ADDRESS, STORY_PROTOCOL_ABI } from "../lib/contracts";
import Toast from "react-native-toast-message";

export function useStoryProtocol() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const tipCreator = async (creator: string, amount: string, storyId: number) => {
    try {
      const hash = await writeContractAsync({
        address: STORY_PROTOCOL_ADDRESS as `0x${string}`,
        abi: STORY_PROTOCOL_ABI,
        functionName: "tipCreator",
        args: [creator as `0x${string}`, parseEther(amount), BigInt(storyId)],
      });
      Toast.show({ type: "success", text1: "Tip sent!" });
      return hash;
    } catch (err) {
      console.error("[useStoryProtocol] Tip failed:", err);
      Toast.show({ type: "error", text1: "Tip failed" });
      throw err;
    }
  };

  const payPaywall = async (author: string, amount: string, contentId: number) => {
    try {
      const hash = await writeContractAsync({
        address: STORY_PROTOCOL_ADDRESS as `0x${string}`,
        abi: STORY_PROTOCOL_ABI,
        functionName: "payPaywall",
        args: [author as `0x${string}`, parseEther(amount), BigInt(contentId)],
      });
      Toast.show({ type: "success", text1: "Content unlocked!" });
      return hash;
    } catch (err) {
      console.error("[useStoryProtocol] Paywall failed:", err);
      Toast.show({ type: "error", text1: "Payment failed" });
      throw err;
    }
  };

  return { tipCreator, payPaywall, address };
}
