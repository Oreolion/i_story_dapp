import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyWalletToken } from "./jwt";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Validate Bearer token from request and return user ID if valid.
 *
 * Accepts two token types:
 *   1. Supabase session JWT (Google/OAuth users)
 *   2. Custom wallet JWT (wallet-authenticated users, signed by our server)
 *
 * Returns null if token is missing or invalid.
 */
export async function validateAuth(
  request: NextRequest
): Promise<string | null> {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);

    // 1. Try Supabase session token (Google/OAuth users)
    try {
      const supabase = getAdminClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (!error && user) {
        return user.id;
      }
    } catch {
      // Not a valid Supabase token — try custom wallet JWT next
    }

    // 2. Try custom wallet JWT (wallet-authenticated users)
    const walletPayload = await verifyWalletToken(token);
    if (walletPayload) {
      return walletPayload.userId;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Validate Bearer token and return user ID, or return a 401 response.
 * Use this when the route requires authentication.
 */
export async function validateAuthOrReject(
  request: NextRequest
): Promise<string | NextResponse> {
  const userId = await validateAuth(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return userId;
}

/**
 * Verify that the authenticated user owns the given wallet address.
 * Looks up the users table to confirm wallet_address matches.
 */
export async function validateWalletOwnership(
  userId: string,
  walletAddress: string
): Promise<boolean> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("users")
      .select("wallet_address")
      .eq("id", userId)
      .single();

    if (error || !data) return false;

    return data.wallet_address?.toLowerCase() === walletAddress.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Resolve the effective users-table ID from the authenticated user ID.
 *
 * For wallet JWT users, the ID already points at the users table row
 * (no Supabase auth user indirection). For Supabase OAuth users,
 * the auth uid usually matches the users table ID directly.
 * Falls back to wallet_address lookup if there's an ID mismatch.
 */
export async function resolveUserId(
  authenticatedUserId: string
): Promise<string> {
  const supabase = getAdminClient();

  // Fast path: ID directly matches a users row
  const { data: directUser } = await supabase
    .from("users")
    .select("id")
    .eq("id", authenticatedUserId)
    .maybeSingle();

  if (directUser) return directUser.id;

  // Slow path: look up via wallet_address from Supabase auth user metadata
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.admin.getUserById(authenticatedUserId);
    const walletAddress = authUser?.user_metadata?.wallet_address;
    if (walletAddress) {
      const { data: walletUser } = await supabase
        .from("users")
        .select("id")
        .eq("wallet_address", walletAddress.toLowerCase())
        .maybeSingle();
      if (walletUser) return walletUser.id;
    }
  } catch {
    // getUserById failed — return original ID
  }

  return authenticatedUserId;
}

/**
 * Helper: check if a value is a NextResponse (i.e., auth failed).
 */
export function isAuthError(
  result: string | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
