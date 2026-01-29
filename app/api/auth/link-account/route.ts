import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/app/utils/supabase/supabaseAdmin";
import { verifyMessage, type Address, isHex } from "viem";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, walletAddress, signature, message } = body ?? {};

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Linking a wallet to a Google-auth account
    if (walletAddress && signature && message) {
      if (typeof signature !== "string" || !isHex(signature)) {
        return NextResponse.json(
          { error: "Invalid signature format" },
          { status: 400 }
        );
      }

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

      const admin = createSupabaseAdminClient();
      const wallet = walletAddress.toLowerCase();

      // Check if wallet is already linked to another account
      const { data: existingWalletUser } = await admin
        .from("users")
        .select("id")
        .eq("wallet_address", wallet)
        .neq("id", userId)
        .maybeSingle();

      if (existingWalletUser) {
        return NextResponse.json(
          { error: "This wallet is already linked to another account" },
          { status: 409 }
        );
      }

      const { data: profile, error } = await admin
        .from("users")
        .update({
          wallet_address: wallet,
          auth_provider: "both",
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        console.error("[LINK-ACCOUNT] Update error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Update Supabase auth metadata
      await admin.auth.admin.updateUserById(userId, {
        user_metadata: { wallet_address: wallet },
      });

      return NextResponse.json({ success: true, user: profile });
    }

    return NextResponse.json(
      { error: "Missing wallet linking fields (walletAddress, signature, message)" },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("[LINK-ACCOUNT] Error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
