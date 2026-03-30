import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/app/utils/supabase/supabaseAdmin";
import { isPaymentSufficient } from "@/lib/blockradar";
import { safeCompare } from "@/lib/crypto";

/**
 * POST /api/payment/webhook
 *
 * Receives webhook events from Blockradar when deposits are confirmed.
 * Activates user subscriptions when payment is sufficient.
 *
 * Webhook events handled:
 * - deposit.success: Payment received, activate subscription
 */
export async function POST(req: NextRequest) {
  try {
    // Verify webhook authenticity via shared secret
    const webhookSecret = process.env.BLOCKRADAR_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[PAYMENT_WEBHOOK] BLOCKRADAR_WEBHOOK_SECRET not configured");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const signature = req.headers.get("x-blockradar-signature") || "";
    if (!safeCompare(signature, webhookSecret)) {
      console.warn("[PAYMENT_WEBHOOK] Invalid signature");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { event, data } = body;

    console.log(`[PAYMENT_WEBHOOK] Event: ${event}`);

    if (event !== "deposit.success") {
      // Acknowledge non-deposit events
      return NextResponse.json({ received: true });
    }

    // Extract payment details
    const {
      amountPaid,
      recipientAddress,
      metadata,
    } = data;

    let userId = metadata?.user_id;
    let plan = metadata?.plan;

    // Fallback: if Blockradar stripped metadata, look up payment by address
    if (!userId || !plan) {
      console.warn("[PAYMENT_WEBHOOK] Missing metadata, falling back to DB lookup");
      const admin = createSupabaseAdminClient();
      const { data: pendingPayment } = await admin
        .from("payments")
        .select("user_id, plan")
        .eq("payment_address", recipientAddress)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!pendingPayment) {
        console.error("[PAYMENT_WEBHOOK] No pending payment found for address:", recipientAddress);
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      }

      userId = pendingPayment.user_id;
      plan = pendingPayment.plan;
    }

    // Verify payment amount matches plan price
    if (!isPaymentSufficient(amountPaid, plan)) {
      console.warn(
        `[PAYMENT_WEBHOOK] Insufficient payment: ${amountPaid} for plan ${plan}`
      );

      // Update payment record as underpaid
      const admin = createSupabaseAdminClient();
      await admin
        .from("payments")
        .update({
          status: "underpaid",
          amount_received: parseFloat(amountPaid),
          updated_at: new Date().toISOString(),
        })
        .eq("payment_address", recipientAddress)
        .eq("status", "pending");

      return NextResponse.json({ received: true, status: "underpaid" });
    }

    const admin = createSupabaseAdminClient();

    // Calculate subscription expiry (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Activate subscription on user record
    const { error: userErr } = await admin
      .from("users")
      .update({
        subscription_plan: plan,
        subscription_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (userErr) {
      console.error("[PAYMENT_WEBHOOK] Failed to update user:", userErr);
      return NextResponse.json(
        { error: "Failed to activate subscription" },
        { status: 500 }
      );
    }

    // Update payment record
    await admin
      .from("payments")
      .update({
        status: "completed",
        amount_received: parseFloat(amountPaid),
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("payment_address", recipientAddress)
      .eq("status", "pending");

    console.log(
      `[PAYMENT_WEBHOOK] Subscription activated: user=${userId} plan=${plan} expires=${expiresAt.toISOString()}`
    );

    return NextResponse.json({
      received: true,
      status: "activated",
      plan,
      expires_at: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error("[PAYMENT_WEBHOOK] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
