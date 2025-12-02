import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/app/utils/supabase/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, title } = body ?? {};

    // Basic validation
    if (!user_id || !title) {
      return NextResponse.json(
        { error: "Missing user_id or title." },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdminClient();

    // (Optional) You can verify the user exists here if needed
    const { data: userRow, error: userErr } = await admin
      .from("users")
      .select("id")
      .eq("id", user_id)
      .single();

    if (userErr || !userRow) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Insert the habit into the "habits" table
    const { data: inserted, error: insertError } = await admin
      .from("habits")
      .insert({ user_id, title })
      .select()
      .single();

    if (insertError) {
      console.error("[API /habits] insert error:", insertError);
      return NextResponse.json(
        { error: insertError.message || "Insert failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ habit: inserted }, { status: 200 });
  } catch (err: any) {
    console.error("[API /habits] unexpected error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
