import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

/**
 * In-memory nonce store with expiry tracking.
 * In production, use Redis or a database table for multi-instance support.
 */
const nonceStore = new Map<string, { nonce: string; createdAt: number }>();
const NONCE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// Cleanup expired nonces periodically
function cleanupExpiredNonces() {
  const now = Date.now();
  for (const [key, entry] of nonceStore) {
    if (now - entry.createdAt > NONCE_EXPIRY_MS) {
      nonceStore.delete(key);
    }
  }
}

/**
 * GET /api/auth/nonce?address=0x...
 * Generate a server-side nonce for wallet signature verification.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address")?.toLowerCase();

    if (!address) {
      return NextResponse.json({ error: "Missing address parameter" }, { status: 400 });
    }

    // Cleanup old nonces
    cleanupExpiredNonces();

    const nonce = randomUUID();
    const timestamp = new Date().toISOString();
    const expiresAt = new Date(Date.now() + NONCE_EXPIRY_MS).toISOString();

    // Store nonce for validation
    nonceStore.set(address, { nonce, createdAt: Date.now() });

    const message = `Welcome to IStory

Sign this message to log in securely.

Site: iStory
Address: ${address}

No transaction · No gas fees · Completely free

Nonce: ${nonce}
Timestamp: ${timestamp}
Expires: ${expiresAt}`;

    return NextResponse.json({ message, nonce });
  } catch (error: unknown) {
    console.error("[NONCE] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Verify a nonce from a signed message. Called by the login route.
 * Exported for use by other modules.
 */
export function verifyNonce(address: string, message: string): { valid: boolean; error?: string } {
  const normalizedAddress = address.toLowerCase();
  const entry = nonceStore.get(normalizedAddress);

  if (!entry) {
    return { valid: false, error: "No nonce found. Please request a new one." };
  }

  // Check expiry
  if (Date.now() - entry.createdAt > NONCE_EXPIRY_MS) {
    nonceStore.delete(normalizedAddress);
    return { valid: false, error: "Nonce expired. Please request a new one." };
  }

  // Verify nonce is in the message
  if (!message.includes(`Nonce: ${entry.nonce}`)) {
    return { valid: false, error: "Invalid nonce in signed message." };
  }

  // Consume the nonce (one-time use)
  nonceStore.delete(normalizedAddress);

  return { valid: true };
}
