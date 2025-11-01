import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { baseSepolia, sepolia } from "wagmi/chains";

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

// This is a safety check. If the ID is missing, it will warn you in the build logs.
if (!projectId) {
  console.warn(
    "Warning: NEXT_PUBLIC_PROJECT_ID is not set in your environment variables."
  );
  console.warn("WalletConnect will not work in production.");
}

// Create the Wagmi config using RainbowKit's helper
export const config = getDefaultConfig({
  appName: "IStory DApp",
  
  projectId: projectId || "",

  chains: [baseSepolia, sepolia],

  // Configure wallet connectors
  ssr: true, // Enable SSR support for Next.js
});
