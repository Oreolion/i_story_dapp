import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from "@/app/utils/supabase/supabaseAdmin";
import { validateAuthOrReject, isAuthError } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const authResult = await validateAuthOrReject(request);
    if (isAuthError(authResult)) return authResult;
    const authenticatedUserId = authResult;

    const { storyId } = await request.json();

    // Validate input
    if (!storyId) {
      return NextResponse.json(
        { error: 'Story ID is required' },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdminClient();

    // Check if already liked (atomic toggle)
    const { data: existingLike } = await admin
      .from("likes")
      .select("id")
      .eq("user_id", authenticatedUserId)
      .eq("story_id", storyId)
      .maybeSingle();

    let isLiked: boolean;
    let totalLikes: number;

    if (existingLike) {
      // Unlike: delete the like record
      const { error: deleteErr } = await admin
        .from("likes")
        .delete()
        .eq("id", existingLike.id);

      if (deleteErr) {
        console.error("[LIKE] Delete error:", deleteErr);
        return NextResponse.json({ error: "Failed to unlike" }, { status: 500 });
      }

      // Decrement story likes count (floor at 0)
      const { data: story } = await admin
        .from("stories")
        .select("likes")
        .eq("id", storyId)
        .single();

      const newLikes = Math.max(0, (story?.likes || 0) - 1);
      await admin
        .from("stories")
        .update({ likes: newLikes })
        .eq("id", storyId);

      isLiked = false;
      totalLikes = newLikes;
    } else {
      // Like: insert new like record (upsert for safety)
      const { error: insertErr } = await admin
        .from("likes")
        .upsert(
          { user_id: authenticatedUserId, story_id: storyId },
          { onConflict: "user_id, story_id" }
        );

      if (insertErr) {
        console.error("[LIKE] Insert error:", insertErr);
        return NextResponse.json({ error: "Failed to like" }, { status: 500 });
      }

      // Increment story likes count
      const { data: story } = await admin
        .from("stories")
        .select("likes")
        .eq("id", storyId)
        .single();

      const newLikes = (story?.likes || 0) + 1;
      await admin
        .from("stories")
        .update({ likes: newLikes })
        .eq("id", storyId);

      isLiked = true;
      totalLikes = newLikes;

      // Create like notification for story author
      const { data: storyAuthor } = await admin
        .from("stories")
        .select("author_id")
        .eq("id", storyId)
        .single();

      if (storyAuthor && storyAuthor.author_id !== authenticatedUserId) {
        const { data: liker } = await admin
          .from("users")
          .select("name, username")
          .eq("id", authenticatedUserId)
          .single();

        await admin.from("notifications").insert({
          user_id: storyAuthor.author_id,
          type: "like",
          title: "New Like",
          message: `${liker?.name || liker?.username || "Someone"} liked your story`,
          story_id: storyId,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        storyId,
        isLiked,
        totalLikes,
        timestamp: new Date().toISOString()
      },
      message: isLiked ? 'Story liked!' : 'Story unliked.'
    });

  } catch (error) {
    console.error('Error processing like:', error);
    return NextResponse.json(
      { error: 'Failed to process like' },
      { status: 500 }
    );
  }
}
