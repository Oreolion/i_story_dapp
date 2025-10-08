import { http, createConfig } from "wagmi";
import { baseSepolia, sepolia } from "wagmi/chains";
import { injected, metaMask, safe } from "wagmi/connectors";

export const config = createConfig({
  chains: [baseSepolia, sepolia],
  connectors: [injected(), metaMask(), safe()],
  transports: {
      [baseSepolia.id]: http("https://sepolia.base.org"), // Base Sepolia RPC
      [sepolia.id]: http("https://rpc.sepolia.org") //  Sepolia RPC
  },
});
