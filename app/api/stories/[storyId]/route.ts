import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/app/utils/supabase/supabaseAdmin";
import { validateAuth } from "@/lib/auth";

/**
 * GET /api/stories/[storyId] — Fetch a single story with author info
 * Public stories are readable by anyone. Private stories require the author's auth.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;
    if (!storyId) {
      return NextResponse.json({ error: "Missing storyId" }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();

    // Fetch story
    const { data: story, error } = await admin
      .from("stories")
      .select(
        `id, numeric_id, title, content, teaser, created_at, story_date, is_public,
         likes, shares, comments_count, has_audio, audio_url, mood, tags,
         paywall_amount, story_type, author_id, author_wallet`
      )
      .eq("id", storyId)
      .maybeSingle();

    if (error) {
      console.error("[API /stories/[storyId]] fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch story" }, { status: 500 });
    }

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    // Private stories: only the author can view them
    if (!story.is_public) {
      const userId = await validateAuth(req);
      if (!userId || userId !== story.author_id) {
        return NextResponse.json({ error: "Story not found" }, { status: 404 });
      }
    }

    // Fetch author by author_id (works for both wallet and OAuth users)
    let author = null;
    if (story.author_id) {
      const { data: authorRow } = await admin
        .from("users")
        .select("id, name, username, avatar, wallet_address, followers_count, badges")
        .eq("id", story.author_id)
        .single();
      author = authorRow;
    }

    // Fetch comments
    const { data: comments } = await admin
      .from("comments")
      .select(
        `id, content, created_at, author_id,
         author:users!comments_author_id_fkey (name, avatar, wallet_address)`
      )
      .eq("story_id", storyId)
      .order("created_at", { ascending: false });

    return NextResponse.json({
      story: { ...story, author },
      comments: comments || [],
    });
  } catch (err: unknown) {
    console.error("[API /stories/[storyId]] unexpected:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
