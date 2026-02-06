import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/app/utils/supabase/supabaseAdmin";
import { validateAuthOrReject, isAuthError } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // Auth check: user must be authenticated
    const authResult = await validateAuthOrReject(req);
    if (isAuthError(authResult)) return authResult;
    const authenticatedUserId = authResult;

    const body = await req.json();
    const { userId, name, username, email } = body ?? {};

    if (!userId || !name || !username || !email) {
      return NextResponse.json(
        { error: "Missing required fields: userId, name, username, email" },
        { status: 400 }
      );
    }

    // Verify the authenticated user matches the userId being onboarded
    if (authenticatedUserId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json(
        { error: "Username must be 3-20 characters (letters, numbers, underscores)" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdminClient();

    // Check username uniqueness
    const { data: existing } = await admin
      .from("users")
      .select("id")
      .eq("username", username)
      .neq("id", userId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Username is not available" },
        { status: 409 }
      );
    }

    const { data: profile, error } = await admin
      .from("users")
      .update({
        name,
        username,
        email,
        is_onboarded: true,
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("[ONBOARDING] Update error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: profile });
  } catch (err: unknown) {
    console.error("[ONBOARDING] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
