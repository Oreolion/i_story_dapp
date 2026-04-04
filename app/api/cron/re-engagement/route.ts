import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/app/utils/supabase/supabaseAdmin";
import { Resend } from "resend";
import { safeCompare } from "@/lib/crypto";
import ReEngagementEmail from "@/components/emails/ReEngagementEmail";

export const dynamic = "force-dynamic";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

/**
 * GET /api/cron/re-engagement
 * Runs daily via Vercel Cron. Sends re-engagement emails to inactive users.
 * Protected by CRON_SECRET header (timing-safe comparison).
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret with timing-safe comparison
    const authHeader = req.headers.get("authorization") || "";
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || !safeCompare(authHeader, `Bearer ${cronSecret}`)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createSupabaseAdminClient();

    // Find users who:
    // 1. Have been onboarded (is_onboarded = true)
    // 2. Have an email
    // 3. Haven't written a story in 7+ days
    // 4. Haven't opted out of re-engagement emails
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: users, error: usersError } = await admin
      .from("users")
      .select("id, name, username, email, notification_preferences")
      .eq("is_onboarded", true)
      .not("email", "is", null);

    if (usersError) {
      console.error("[CRON re-engagement] Users fetch error:", usersError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ sent: 0, message: "No users to process" });
    }

    let sent = 0;
    let skipped = 0;
    const resend = getResend();

    for (const user of users) {
      // Check preferences — skip if re-engagement emails are disabled
      const prefs = user.notification_preferences;
      if (prefs && prefs.re_engagement_emails === false) {
        skipped++;
        continue;
      }
      if (prefs && prefs.email_notifications === false) {
        skipped++;
        continue;
      }

      // Check last story date
      const { data: lastStory } = await admin
        .from("stories")
        .select("created_at")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastStoryDate = lastStory?.created_at
        ? new Date(lastStory.created_at)
        : null;

      // Skip if they posted within the last 7 days
      if (lastStoryDate && lastStoryDate > sevenDaysAgo) {
        continue;
      }

      // Calculate days since last story (or days since account creation)
      const daysSince = lastStoryDate
        ? Math.floor((Date.now() - lastStoryDate.getTime()) / (1000 * 60 * 60 * 24))
        : 14; // Default for users who never wrote

      // Only send once per tier: 7 days, 14 days, 30 days
      // Skip users who fall between tiers (e.g., 10 days — wait until 14)
      if (daysSince < 7) continue;
      if (daysSince > 7 && daysSince < 14) continue;
      if (daysSince > 14 && daysSince < 30) continue;
      if (daysSince > 30) continue; // Don't spam users who've been gone 30+ days repeatedly

      try {
        await resend.emails.send({
          from: "EStories <noreply@estories.app>",
          to: [user.email],
          subject:
            daysSince >= 30
              ? "Your stories are waiting for you"
              : daysSince >= 14
              ? "Two weeks without a story?"
              : "Time to capture today's story",
          react: ReEngagementEmail({
            username: user.name || user.username || "Storyteller",
            daysSinceLastStory: daysSince,
          }),
        });
        sent++;
      } catch (emailErr) {
        console.error(`[CRON re-engagement] Email to ${user.id} failed:`, emailErr);
      }
    }

    return NextResponse.json({
      sent,
      skipped,
      total: users.length,
      message: `Re-engagement emails sent: ${sent}, skipped: ${skipped}`,
    });
  } catch (err) {
    console.error("[CRON re-engagement] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
