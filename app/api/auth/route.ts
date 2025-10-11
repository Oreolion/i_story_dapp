import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/utils/supabase/supabaseServer";

export async function POST(req: NextRequest) {
  try {
    const { address, signature, message } = await req.json();
    console.log("[DEV_BYPASS_SIG] signature verification bypassed (DEV ONLY)");

    const supabase = await createSupabaseServerClient();
    console.log("Supabase client ready:", typeof supabase.from === "function");

    // Upsert wallet with defaults
    const { data: user, error: upsertError } = await supabase
      .from("users")
      .upsert(
        {
          wallet_address: (address as string).toLowerCase(),
          name: "Anonymous User", // Default; Google overrides via trigger
          email: null,
          avatar_url: null,
        },
        { onConflict: "wallet_address" }
      )
      .select()
      .single();

    if (upsertError) {
      console.error("Supabase upsert error:", upsertError);
      return NextResponse.json(
        { error: "User creation failed" },
        { status: 500 }
      );
    }

    // Set Supabase session for wallet (custom token; in prod, generate real JWT)
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.signInWithIdToken({
      provider: "email", // Dummy for custom
      token: "wallet-custom-token-" + address, // Replace with real JWT in prod
    });

    if (sessionError) {
      console.error("Session error:", sessionError);
    }

    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error("Auth route error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// Handle Google callback (Supabase redirects here after OAuth)
export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) {
    // Sync wallet if provided in metadata (optional)
    if (session.user.user_metadata.wallet_address) {
      await supabase
        .from("users")
        .update({ wallet_address: session.user.user_metadata.wallet_address })
        .eq("id", session.user.id);
    }
    return NextResponse.redirect(new URL("/profile", req.url));
  }
  return NextResponse.redirect(new URL("/auth/error", req.url));
}
