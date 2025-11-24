import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

// This client runs on your server/API routes to verify transactions
export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(), // Uses default public RPC. For production, use Alchemy/Infura here.
});