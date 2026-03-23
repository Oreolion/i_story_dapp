// Hook: Gate Web3 actions behind wallet connection
import { useAccount } from "wagmi";
import { useAppKit } from "@reown/appkit-react-native";
import Toast from "react-native-toast-message";

export function useWalletGuard() {
  const { isConnected } = useAccount();
  const { open } = useAppKit();

  /**
   * Returns true if wallet is connected.
   * If not, shows a toast and opens the wallet modal.
   */
  const requireWallet = (actionLabel?: string): boolean => {
    if (isConnected) return true;

    const label = actionLabel || "This action";
    Toast.show({
      type: "info",
      text1: "Wallet Required",
      text2: `${label} requires a connected wallet.`,
    });

    // Open AppKit wallet modal
    try {
      open();
    } catch {
      // Silently fail if modal can't open (e.g., web platform)
    }

    return false;
  };

  return { requireWallet, isWalletConnected: isConnected };
}
