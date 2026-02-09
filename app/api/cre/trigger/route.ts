import { NextRequest, NextResponse } from "next/server";
import { validateAuthOrReject, isAuthError } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/app/utils/supabase/supabaseAdmin";

/**
 * POST /api/cre/trigger
 * Triggers CRE story verification workflow.
 * Sends story content directly in the CRE trigger payload (Approach B).
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await validateAuthOrReject(req);
    if (isAuthError(authResult)) return authResult;
    const authenticatedUserId = authResult;

    const { storyId } = await req.json();

    if (!storyId) {
      return NextResponse.json({ error: "Story ID is required" }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();

    // Fetch story with content and author wallet
    const { data: story, error: storyError } = await admin
      .from("stories")
      .select("id, title, content, author_id, author_wallet")
      .eq("id", storyId)
      .single();

    if (storyError || !story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    if (story.author_id !== authenticatedUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!story.content || story.content.trim().length === 0) {
      return NextResponse.json({ error: "Story has no content to verify" }, { status: 400 });
    }

    if (!story.author_wallet) {
      return NextResponse.json({ error: "Author wallet address required for verification" }, { status: 400 });
    }

    // Check if already verified
    const { data: existing } = await admin
      .from("verified_metrics")
      .select("id")
      .eq("story_id", storyId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Story already verified" }, { status: 409 });
    }

    // Check if verification is already pending
    const { data: pendingLog } = await admin
      .from("verification_logs")
      .select("id")
      .eq("story_id", storyId)
      .eq("status", "pending")
      .maybeSingle();

    if (pendingLog) {
      return NextResponse.json({ error: "Verification already in progress" }, { status: 409 });
    }

    // Create verification log
    const workflowRunId = `wf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const { error: logError } = await admin
      .from("verification_logs")
      .insert({
        story_id: storyId,
        workflow_run_id: workflowRunId,
        status: "pending",
      });

    if (logError) {
      console.error("[CRE/TRIGGER] Log insert error:", logError);
      return NextResponse.json({ error: "Failed to start verification" }, { status: 500 });
    }

    // Trigger CRE workflow with content in payload (Approach B — standard pattern)
    const creWorkflowUrl = process.env.CRE_WORKFLOW_URL;
    if (creWorkflowUrl) {
      fetch(creWorkflowUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.CRE_API_KEY || ""}`,
        },
        body: JSON.stringify({
          storyId: story.id,
          title: story.title || "Untitled",
          content: story.content,
          authorWallet: story.author_wallet,
        }),
      }).catch(err => console.error("[CRE/TRIGGER] Workflow trigger failed:", err));
    } else {
      console.warn("[CRE/TRIGGER] CRE_WORKFLOW_URL not set, skipping workflow trigger");
    }

    return NextResponse.json({
      success: true,
      workflowRunId,
      message: "Verification started",
    });
  } catch (error) {
    console.error("[CRE/TRIGGER] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
