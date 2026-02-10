import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/app/utils/supabase/supabaseAdmin";
import { validateAuthOrReject, isAuthError, resolveUserId } from "@/lib/auth";

// GET /api/habits?user_id=...&date=YYYY-MM-DD
// Returns habits and (optionally) today's daily log for the user
export async function GET(req: NextRequest) {
  try {
    // Auth check
    const authResult = await validateAuthOrReject(req);
    if (isAuthError(authResult)) return authResult;
    const effectiveUserId = await resolveUserId(authResult);

    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");
    const date = searchParams.get("date"); // optional, for daily log

    if (!user_id) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    // Verify user_id matches authenticated user (resolved via wallet fallback)
    if (effectiveUserId !== user_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = createSupabaseAdminClient();

    // Fetch habits
    const { data: habits, error: habitsErr } = await admin
      .from("habits")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: true });

    if (habitsErr) {
      console.error("[API /habits GET] habits error:", habitsErr);
      return NextResponse.json(
        { error: "Failed to fetch habits" },
        { status: 500 }
      );
    }

    // Optionally fetch today's daily log
    let dailyLog = null;
    if (date) {
      const { data: logData, error: logErr } = await admin
        .from("daily_logs")
        .select("*")
        .eq("user_id", user_id)
        .eq("date", date)
        .maybeSingle();

      if (logErr) {
        console.error("[API /habits GET] daily_log error:", logErr);
      } else {
        dailyLog = logData;
      }
    }

    return NextResponse.json({ habits: habits || [], dailyLog });
  } catch (err: unknown) {
    console.error("[API /habits GET] unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/habits - Create a new habit
export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authResult = await validateAuthOrReject(req);
    if (isAuthError(authResult)) return authResult;
    const effectiveUserId = await resolveUserId(authResult);

    const body = await req.json();
    const { user_id, title } = body ?? {};

    if (!user_id || !title) {
      return NextResponse.json(
        { error: "Missing user_id or title." },
        { status: 400 }
      );
    }

    // Verify user_id matches authenticated user (resolved via wallet fallback)
    if (effectiveUserId !== user_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = createSupabaseAdminClient();

    const { data: userRow, error: userErr } = await admin
      .from("users")
      .select("id")
      .eq("id", user_id)
      .single();

    if (userErr || !userRow) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const { data: inserted, error: insertError } = await admin
      .from("habits")
      .insert({ user_id, title })
      .select()
      .single();

    if (insertError) {
      console.error("[API /habits POST] insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create habit" },
        { status: 500 }
      );
    }

    return NextResponse.json({ habit: inserted }, { status: 200 });
  } catch (err: unknown) {
    console.error("[API /habits POST] unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/habits - Upsert daily log state
export async function PUT(req: NextRequest) {
  try {
    // Auth check
    const authResult = await validateAuthOrReject(req);
    if (isAuthError(authResult)) return authResult;
    const effectiveUserId = await resolveUserId(authResult);

    const body = await req.json();
    const { user_id, date, completed_habit_ids, notes, mood } = body ?? {};

    if (!user_id || !date) {
      return NextResponse.json(
        { error: "Missing user_id or date" },
        { status: 400 }
      );
    }

    // Verify user_id matches authenticated user (resolved via wallet fallback)
    if (effectiveUserId !== user_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = createSupabaseAdminClient();

    const { data: upserted, error } = await admin
      .from("daily_logs")
      .upsert(
        {
          user_id,
          date,
          completed_habit_ids: completed_habit_ids || [],
          notes: notes || "",
          mood: mood || "good",
        },
        { onConflict: "user_id, date" }
      )
      .select()
      .single();

    if (error) {
      console.error("[API /habits PUT] upsert error:", error);
      return NextResponse.json(
        { error: "Failed to save daily log" },
        { status: 500 }
      );
    }

    return NextResponse.json({ dailyLog: upserted });
  } catch (err: unknown) {
    console.error("[API /habits PUT] unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/habits?id=... - Delete a habit
export async function DELETE(req: NextRequest) {
  try {
    // Auth check
    const authResult = await validateAuthOrReject(req);
    if (isAuthError(authResult)) return authResult;
    const effectiveUserId = await resolveUserId(authResult);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing habit id" }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();

    // Verify the habit belongs to the authenticated user
    const { data: habit } = await admin
      .from("habits")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!habit || habit.user_id !== effectiveUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await admin.from("habits").delete().eq("id", id);

    if (error) {
      console.error("[API /habits DELETE] error:", error);
      return NextResponse.json(
        { error: "Failed to delete habit" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[API /habits DELETE] unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
