import crypto from "crypto";

const SECRET = process.env.LINK_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback-secret";
const TOKEN_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export interface LinkingTokenPayload {
  userId: string;
  walletAddress: string;
  timestamp: number;
}

/**
 * Creates an HMAC-signed linking token that proves a wallet user
 * initiated the Google linking flow. Server-side only.
 */
export function createLinkingToken(userId: string, walletAddress: string): string {
  const payload: LinkingTokenPayload = {
    userId,
    walletAddress: walletAddress.toLowerCase(),
    timestamp: Date.now(),
  };

  const payloadStr = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadStr).toString("base64url");

  const hmac = crypto.createHmac("sha256", SECRET);
  hmac.update(payloadB64);
  const signature = hmac.digest("base64url");

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies and decodes a linking token. Returns the payload if valid,
 * or null if invalid/expired. Server-side only.
 */
export function verifyLinkingToken(token: string): LinkingTokenPayload | null {
  try {
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) return null;

    // Verify signature
    const hmac = crypto.createHmac("sha256", SECRET);
    hmac.update(payloadB64);
    const expectedSig = hmac.digest("base64url");

    if (signature !== expectedSig) return null;

    // Decode and check expiry
    const payloadStr = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload: LinkingTokenPayload = JSON.parse(payloadStr);

    if (Date.now() - payload.timestamp > TOKEN_EXPIRY_MS) {
      return null; // Token expired
    }

    return payload;
  } catch {
    return null;
  }
}
