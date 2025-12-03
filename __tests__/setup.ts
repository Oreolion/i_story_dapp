import '@testing-library/jest-dom';
import { vi } from 'vitest';

// 1. Mock ResizeObserver (Required for Radix/Shadcn UI)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// 2. Mock Wagmi (Crucial for dApps)
vi.mock('wagmi', async () => {
  return {
    useAccount: () => ({
      address: '0x123...abc',
      isConnected: true,
    }),
    useConnect: () => ({ connect: vi.fn() }),
    useDisconnect: () => ({ disconnect: vi.fn() }),
    // Add other hooks you use here as simple mocks
  };
});

// 3. Mock Next/Navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
  useParams: () => ({ storyId: '123' }),
}));