import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/app/utils/supabase/supabaseAdmin";

/**
 * Links a Google OAuth user to an existing wallet-based account.
 *
 * Called from AuthProvider when a Google sign-in detects an email match
 * with an existing wallet user. Uses the admin client to bypass RLS,
 * since the authenticated user (new Google auth ID) differs from the
 * existing wallet user's row ID.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { existingUserId, googleId, googleEmail, googleAvatar, googleName } =
      body ?? {};

    if (!existingUserId || !googleId) {
      return NextResponse.json(
        { error: "Missing existingUserId or googleId" },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdminClient();

    // Verify the existing user actually exists
    const { data: existing, error: fetchErr } = await admin
      .from("users")
      .select("*")
      .eq("id", existingUserId)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update the existing user with Google info, preserving wallet_address
    const { data: updated, error: updateErr } = await admin
      .from("users")
      .update({
        google_id: googleId,
        auth_provider: existing.wallet_address ? "both" : "google",
        avatar: existing.avatar || googleAvatar || null,
        email: existing.email || googleEmail || null,
        name: existing.name || googleName || null,
      })
      .eq("id", existingUserId)
      .select()
      .single();

    if (updateErr) {
      console.error("[LINK-GOOGLE] Update error:", updateErr);
      return NextResponse.json(
        { error: updateErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    console.error("[LINK-GOOGLE] Error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
