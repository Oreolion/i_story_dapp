import { NextRequest, NextResponse } from "next/server";
import { validateAuthOrReject, isAuthError } from "@/lib/auth";
import { createPaymentAddress, PLAN_PRICES } from "@/lib/blockradar";
import { createSupabaseAdminClient } from "@/app/utils/supabase/supabaseAdmin";

/**
 * POST /api/payment/create
 *
 * Creates a Blockradar payment address for the authenticated user.
 * The user sends USDC/USDT to this address to activate their subscription.
 *
 * Body: { plan: "storyteller" | "creator" }
 * Returns: { address, amount, currency, plan }
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await validateAuthOrReject(req);
    if (isAuthError(authResult)) return authResult;
    const userId = authResult;

    const body = await req.json();
    const { plan } = body;

    if (!plan || !PLAN_PRICES[plan]) {
      return NextResponse.json(
        { error: "Invalid plan. Choose 'storyteller' or 'creator'." },
        { status: 400 }
      );
    }

    // Check if user already has an active subscription
    const admin = createSupabaseAdminClient();
    const { data: user } = await admin
      .from("users")
      .select("subscription_plan, subscription_expires_at")
      .eq("id", userId)
      .single();

    if (
      user?.subscription_plan === plan &&
      user?.subscription_expires_at &&
      new Date(user.subscription_expires_at) > new Date()
    ) {
      return NextResponse.json(
        { error: "You already have an active subscription for this plan." },
        { status: 409 }
      );
    }

    // Create Blockradar payment address
    const paymentAddress = await createPaymentAddress(userId, plan);

    // Expire any stale pending payments for this user before creating a new one
    // (covers both null expires_at and past expires_at)
    await admin
      .from("payments")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("status", "pending");

    // Payment address expires in 1 hour
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Store pending payment in database
    const { error: insertErr } = await admin.from("payments").insert({
      user_id: userId,
      plan,
      blockradar_address_id: paymentAddress.id,
      payment_address: paymentAddress.address,
      amount_expected: PLAN_PRICES[plan],
      currency: "USDC",
      status: "pending",
      expires_at: expiresAt.toISOString(),
    });

    if (insertErr) {
      console.error("[PAYMENT_CREATE] DB insert error:", insertErr);
      return NextResponse.json(
        { error: "Failed to record payment" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      address: paymentAddress.address,
      amount: PLAN_PRICES[plan],
      currency: "USDC",
      plan,
      network: "Base",
      note: "Send exactly the amount shown in USDC to this address. Your subscription will activate automatically.",
    });
  } catch (err) {
    console.error("[PAYMENT_CREATE] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
