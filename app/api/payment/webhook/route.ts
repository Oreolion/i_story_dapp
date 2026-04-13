import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/app/utils/supabase/supabaseAdmin";
import { isPaymentSufficient } from "@/lib/blockradar";
import { activateSubscription } from "@/lib/subscription";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * POST /api/payment/webhook
 *
 * Receives webhook events from Blockradar when deposits are confirmed.
 * Activates user subscriptions when payment is sufficient.
 *
 * Blockradar signs webhooks with HMAC-SHA512 using your API key.
 * The signature is sent in the `x-blockradar-signature` header.
 *
 * Webhook events handled:
 * - deposit.success: Payment received, activate subscription
 */
export async function POST(req: NextRequest) {
  try {
    // Verify webhook authenticity via HMAC-SHA512 signature
    // Blockradar signs the request body with your API key (per docs)
    const apiKey = process.env.BLOCKRADAR_API_KEY;
    if (!apiKey) {
      console.error("[PAYMENT_WEBHOOK] BLOCKRADAR_API_KEY not configured");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const signature = req.headers.get("x-blockradar-signature") || "";
    const rawBody = await req.text();

    const expectedSignature = createHmac("sha512", apiKey)
      .update(rawBody)
      .digest("hex");

    // Timing-safe comparison to prevent timing attacks
    const sigBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    if (
      sigBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      console.warn("[PAYMENT_WEBHOOK] Invalid HMAC signature");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
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
    } = data;

    const admin = createSupabaseAdminClient();

    // ── STEP 1: Find and atomically claim the pending payment ────────
    // Always look up by address in our DB (defense in depth — don't trust
    // webhook metadata for userId/plan). The .eq("status", "pending")
    // filter is the idempotency guard: if the webhook is replayed, the
    // payment is already "completed" and this returns null → no action.
    const { data: pendingPayment } = await admin
      .from("payments")
      .select("user_id, plan, amount_expected")
      .eq("payment_address", recipientAddress)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!pendingPayment) {
      // Either a replay (already completed) or unknown address
      console.warn("[PAYMENT_WEBHOOK] No pending payment for address:", recipientAddress);
      return NextResponse.json({ received: true, status: "already_processed" });
    }

    const { user_id: userId, plan } = pendingPayment;

    // ── STEP 2: Verify payment amount matches plan price ─────────────
    if (!isPaymentSufficient(amountPaid, plan)) {
      console.warn(
        `[PAYMENT_WEBHOOK] Insufficient payment: ${amountPaid} for plan ${plan}`
      );

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

    // ── STEP 3: Mark payment as completed FIRST (replay guard) ───────
    // If this update matches 0 rows, another concurrent webhook already
    // processed it — safe to skip.
    const { data: completedPayment } = await admin
      .from("payments")
      .update({
        status: "completed",
        amount_received: parseFloat(amountPaid),
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("payment_address", recipientAddress)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (!completedPayment) {
      // Another webhook instance already processed this payment
      console.warn("[PAYMENT_WEBHOOK] Payment already processed (concurrent webhook):", recipientAddress);
      return NextResponse.json({ received: true, status: "already_processed" });
    }

    // ── STEP 4: Activate subscription + notify + email ─────────────
    try {
      const { expiresAt } = await activateSubscription(admin, userId, plan);

      return NextResponse.json({
        received: true,
        status: "activated",
        plan,
        expires_at: expiresAt,
      });
    } catch (activateErr) {
      console.error("[PAYMENT_WEBHOOK] Activation failed:", activateErr);
      // Payment is already marked completed — log for manual intervention
      // Do NOT revert payment status (that would allow double-activation on retry)
      return NextResponse.json(
        { error: "Failed to activate subscription" },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("[PAYMENT_WEBHOOK] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
