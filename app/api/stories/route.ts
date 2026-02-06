// app/api/stories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/app/utils/supabase/supabaseAdmin";
import { validateAuthOrReject, isAuthError } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authResult = await validateAuthOrReject(req);
    if (isAuthError(authResult)) return authResult;
    const authenticatedUserId = authResult;

    const body = await req.json();

    const {
      author_id,
      author_wallet,
      title,
      content,
      has_audio,
      audio_url,
      tags,
      mood,
      ipfs_hash,
    } = body ?? {};

    // Basic validation
    if (!author_id || !author_wallet || !title || !content) {
      return NextResponse.json(
        { error: "Missing required fields (author_id, author_wallet, title, content)." },
        { status: 400 }
      );
    }

    // Verify author_id matches authenticated user
    if (authenticatedUserId !== author_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = createSupabaseAdminClient();

    // Extra safety: verify that this user exists + wallet matches
    const { data: userRow, error: userErr } = await admin
      .from("users")
      .select("id, wallet_address")
      .eq("id", author_id)
      .single();

    if (userErr || !userRow) {
      console.error("[API /stories] user lookup error:", userErr);
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    if (userRow.wallet_address !== author_wallet.toLowerCase()) {
      console.warn("[API /stories] wallet mismatch for user", author_id);
      return NextResponse.json({ error: "Wallet mismatch" }, { status: 401 });
    }

    const { data: inserted, error: insertError } = await admin
      .from("stories")
      .insert({
        author_id,
        author_wallet: author_wallet.toLowerCase(),
        title,
        content,
        has_audio: !!has_audio,
        audio_url: audio_url ?? null,
        likes: 0,
        comments_count: 0,
        shares: 0,
        tags: tags ?? [],
        mood: mood ?? "neutral",
        ipfs_hash: ipfs_hash ?? null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[API /stories] insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save story" },
        { status: 500 }
      );
    }

    return NextResponse.json({ story: inserted }, { status: 200 });
  } catch (err: unknown) {
    console.error("[API /stories] unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
