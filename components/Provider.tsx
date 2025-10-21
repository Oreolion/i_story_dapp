"use client";
import { ThemeProvider } from "next-themes";
import { createContext, useContext, ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit"; // RainbowKit
import { config } from "@/lib/wagmi.config";
import { useAccount, useBalance } from "wagmi";
import { AuthProvider } from "./AuthProvider";
// import { useReadContract } from 'wagmi'; // Uncomment later
// import { iStoryTokenABI } from '@/lib/abis/iStoryToken.json';

const queryClient = new QueryClient();

interface User {
  address: string;
  balance: string;
  storyTokens: number;
  badges: string[];
}

interface AppContextType {
  user: User | null;
  isConnected: boolean;
  isDisconnected: boolean;
  connectWallet: () => void;
  disconnectWallet: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}

function AppInner({ children }: { children: ReactNode }) {
  const { address, isConnected, isDisconnected } = useAccount();
  const { data: ethBalance } = useBalance({ address });

  // const { data: storyTokens } = useReadContract({ // Uncomment after deploy
  //   address: '0xYouriStoryTokenAddress',
  //   abi: iStoryTokenABI.default,
  //   functionName: 'balanceOf',
  //   args: [address as `0x${string}`],
  //   chainId: baseSepolia.id,
  // });

  const user: User | null =
    isConnected && address
      ? {
          address: `${address.slice(0, 6)}...${address.slice(-4)}`,
          balance: ethBalance?.formatted || "0",
          storyTokens: 150, // Mock until uncommented
          badges: ["Early Adopter", "10-Day Streak"],
        }
      : null;

  return (
    <AppContext.Provider
      value={{
        user,
        isConnected,
        isDisconnected,
        connectWallet: () => {},
        disconnectWallet: () => {},
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          {" "}
          {/* RainbowKit wraps app */}
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <AuthProvider>
              <AppInner>{children}</AppInner>
            </AuthProvider>
          </ThemeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
