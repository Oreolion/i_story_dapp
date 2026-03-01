// app/api/stories/feed/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/app/utils/supabase/supabaseAdmin";

/**
 * GET /api/stories/feed — Fetch public stories feed with author info (bypasses RLS)
 * No auth required — this is public content.
 */
export async function GET(req: NextRequest) {
  try {
    const admin = createSupabaseAdminClient();

    const { data, error } = await admin
      .from("stories")
      .select(
        `
        id, numeric_id, title, content, created_at, likes, comments_count, shares,
        has_audio, audio_url, mood, tags, paywall_amount, teaser, is_public,
        author:users!stories_author_wallet_fkey (
          id, name, username, avatar, wallet_address, followers_count, badges
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[API /stories/feed] fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch feed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ stories: data || [] });
  } catch (err: unknown) {
    console.error("[API /stories/feed] unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
