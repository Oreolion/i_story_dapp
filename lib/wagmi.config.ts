import { http, createConfig } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { injected, metaMask, safe } from "wagmi/connectors";

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [injected(), metaMask(), safe()],
  transports: {
    [baseSepolia.id]: http("https://sepolia.base.org"), // Base Sepolia RPC
  },
});
