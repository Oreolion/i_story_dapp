import { NextRequest, NextResponse } from "next/server";
import { verifyMessage, type Address, isHex } from "viem";
import { createSupabaseAdminClient } from "@/app/utils/supabase/supabaseAdmin";
import { createLinkingToken } from "@/app/utils/linkingToken";

/**
 * Initiates a secure Google linking flow for wallet users.
 *
 * Requires wallet signature to prove ownership before generating
 * a linking token. This prevents account takeover attacks where
 * an attacker tries to link their Google account to someone else's wallet.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, walletAddress, signature, message } = body ?? {};

    if (!userId || !walletAddress || !signature || !message) {
      return NextResponse.json(
        { error: "Missing required fields: userId, walletAddress, signature, message" },
        { status: 400 }
      );
    }

    // Validate signature format
    if (typeof signature !== "string" || !isHex(signature)) {
      return NextResponse.json(
        { error: "Invalid signature format" },
        { status: 400 }
      );
    }

    // Verify wallet signature
    const isValid = await verifyMessage({
      address: walletAddress as Address,
      message,
      signature: signature as `0x${string}`,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: "Signature verification failed" },
        { status: 401 }
      );
    }

    // Verify the user exists and owns this wallet
    const admin = createSupabaseAdminClient();
    const wallet = walletAddress.toLowerCase();

    const { data: user, error: fetchErr } = await admin
      .from("users")
      .select("id, wallet_address, auth_provider, google_id")
      .eq("id", userId)
      .single();

    if (fetchErr || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.wallet_address?.toLowerCase() !== wallet) {
      return NextResponse.json(
        { error: "Wallet address does not match user" },
        { status: 403 }
      );
    }

    // Check if already linked to Google
    if (user.google_id || user.auth_provider === "both") {
      return NextResponse.json(
        { error: "Google account already linked" },
        { status: 409 }
      );
    }

    // Generate secure linking token
    const token = createLinkingToken(userId, wallet);

    return NextResponse.json({ success: true, linkingToken: token });
  } catch (err: any) {
    console.error("[INITIATE-LINK] Error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
