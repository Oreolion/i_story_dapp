import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/utils/supabase/supabaseServer";

export async function POST(req: NextRequest) {
  try {
    const { address, signature, message } = await req.json();
    console.log("[DEV_BYPASS_SIG] signature verification bypassed (DEV ONLY)");

    // 🧠 Correct Supabase client
    const supabase = await createSupabaseServerClient();
    console.log("Supabase client ready:", typeof supabase.from === "function");

    // 🧩 Upsert wallet
    const { data: user, error: upsertError } = await supabase
      .from("users")
      .upsert(
        { wallet_address: (address as string).toLowerCase() },
        { onConflict: "wallet_address" }
      )
      .select()
      .single();

    if (upsertError) {
      console.error("Supabase upsert error:", upsertError);
      return NextResponse.json({ error: "User creation failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error("Auth route error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
