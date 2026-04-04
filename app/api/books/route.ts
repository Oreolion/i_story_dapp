// app/api/books/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/app/utils/supabase/supabaseAdmin";
import { validateAuthOrReject, isAuthError } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const authResult = await validateAuthOrReject(req);
    if (isAuthError(authResult)) return authResult;
    const authenticatedUserId = authResult;

    const body = await req.json();

    const {
      title,
      description,
      story_ids,
      ipfs_hash,
    } = body ?? {};

    if (
      !title ||
      !Array.isArray(story_ids) ||
      story_ids.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields (title, story_ids[]).",
        },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdminClient();

    // Verify user exists and get wallet
    const { data: userRow, error: userErr } = await admin
      .from("users")
      .select("id, wallet_address")
      .eq("id", authenticatedUserId)
      .single();

    if (userErr || !userRow) {
      console.error("[API /books] user lookup error:", userErr);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Insert book (author_id from auth token, not request body)
    const { data: inserted, error: insertError } = await admin
      .from("books")
      .insert({
        author_id: authenticatedUserId,
        author_wallet: userRow.wallet_address ?? null,
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
