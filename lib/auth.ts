import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Validate Bearer token from request and return user ID if valid.
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
    const supabase = getAdminClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    return user.id;
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
 * Helper: check if a value is a NextResponse (i.e., auth failed).
 */
export function isAuthError(
  result: string | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
