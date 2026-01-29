import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/utils/supabase/supabaseServer";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/?auth_error=missing_code`);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[AUTH CALLBACK] Code exchange failed:", error.message);
      return NextResponse.redirect(`${origin}/?auth_error=exchange_failed`);
    }

    return NextResponse.redirect(origin);
  } catch (err) {
    console.error("[AUTH CALLBACK] Unexpected error:", err);
    return NextResponse.redirect(`${origin}/?auth_error=true`);
  }
}
