import { http, createConfig } from "wagmi";
import { baseSepolia, sepolia } from "wagmi/chains";

/**
 * This is a SERVER-SAFE configuration for Wagmi.
 * It is used by API routes (e.g., /api/paywall) that need to interact
 * with the blockchain on the server.
 *
 * It does NOT use RainbowKit's getDefaultConfig(), which is client-only.
 */
export const config = createConfig({
  chains: [baseSepolia, sepolia],
  // Note: No connectors are needed for server-side actions
  transports: {
    [baseSepolia.id]: http("https://sepolia.base.org"), // Base Sepolia RPC
    [sepolia.id]: http("https://rpc.sepolia.org"), //  Sepolia RPC
  },
});
