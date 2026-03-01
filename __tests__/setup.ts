import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { vi } from 'vitest';
import { webcrypto } from 'node:crypto';

// Polyfill Web Crypto API for jsdom (vault encryption tests)
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: true,
  });
}

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