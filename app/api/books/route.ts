// app/api/books/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/app/utils/supabase/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      author_id,
      author_wallet,
      title,
      description,
      story_ids,
      ipfs_hash,
    } = body ?? {};

    // Basic validation
    if (
      !author_id ||
      !author_wallet ||
      !title ||
      !Array.isArray(story_ids) ||
      story_ids.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields (author_id, author_wallet, title, story_ids[]).",
        },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdminClient();

    // 1) Verify user exists + wallet matches
    const { data: userRow, error: userErr } = await admin
      .from("users")
      .select("id, wallet_address")
      .eq("id", author_id)
      .single();

    if (userErr || !userRow) {
      console.error("[API /books] user lookup error:", userErr);
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    if (userRow.wallet_address !== author_wallet.toLowerCase()) {
      console.warn("[API /books] wallet mismatch for user", author_id);
      return NextResponse.json({ error: "Wallet mismatch" }, { status: 401 });
    }

    // 2) Insert book
    const { data: inserted, error: insertError } = await admin
      .from("books")
      .insert({
        author_id,
        author_wallet: author_wallet.toLowerCase(),
        title,
        description: description ?? null,
        story_ids,
        ipfs_hash: ipfs_hash ?? null,
        likes: 0,
        views: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[API /books] insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save book" },
        { status: 500 }
      );
    }

    return NextResponse.json({ book: inserted }, { status: 200 });
  } catch (err: unknown) {
    console.error("[API /books] unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
