/**
 * In-memory nonce store with expiry tracking.
 * In production, use Redis or a database table for multi-instance support.
 */
const nonceStore = new Map<string, { nonce: string; createdAt: number }>();
const NONCE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export function cleanupExpiredNonces() {
  const now = Date.now();
  for (const [key, entry] of nonceStore) {
    if (now - entry.createdAt > NONCE_EXPIRY_MS) {
      nonceStore.delete(key);
    }
  }
}

export function storeNonce(address: string, nonce: string) {
  nonceStore.set(address.toLowerCase(), { nonce, createdAt: Date.now() });
}

export function verifyNonce(address: string, message: string): { valid: boolean; error?: string } {
  const normalizedAddress = address.toLowerCase();
  const entry = nonceStore.get(normalizedAddress);

  if (!entry) {
    return { valid: false, error: "No nonce found. Please request a new one." };
  }

  if (Date.now() - entry.createdAt > NONCE_EXPIRY_MS) {
    nonceStore.delete(normalizedAddress);
    return { valid: false, error: "Nonce expired. Please request a new one." };
  }

  if (!message.includes(`Nonce: ${entry.nonce}`)) {
    return { valid: false, error: "Invalid nonce in signed message." };
  }

  // Consume the nonce (one-time use)
  nonceStore.delete(normalizedAddress);

  return { valid: true };
}

export { NONCE_EXPIRY_MS };
