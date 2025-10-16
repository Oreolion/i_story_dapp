// app/api/auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/utils/supabase/supabaseServer";
import { createSupabaseAdminClient } from "@/app/utils/supabase/supabaseAdmin";
import { verifyMessage } from "viem";

/**
 * Wallet login route (server)
 * Expects JSON body: { address, signature, message }
 *
 * Behaviour:
 *  - verifies signature
 *  - finds a Supabase auth user by:
 *      1) email === walletEmail OR
 *      2) user_metadata.wallet_address === address
 *  - if an OAuth user exists without wallet metadata, update that user's metadata to include the wallet address
 *  - otherwise create a new deterministic auth user for the wallet
 *  - upsert into public.users using the auth user id
 *  - returns profile
 *
 * Note: For synthetic emails like 0x...@wallet.local we DO NOT attempt to sign-in-with-otp (magic link).
 * Session creation (cookie) is left to client or a separate secure flow if you want an automatic server session.
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, signature, message } = body ?? {};
    if (!address || !signature || !message) {
      return NextResponse.json(
        { error: "Missing wallet data" },
        { status: 400 }
      );
    }
    // 1. Verify wallet signature
    const isValid = await verifyMessage({ address, message, signature });
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    const admin = createSupabaseAdminClient();
    const walletAddress = address.toLowerCase();
    const walletEmail = `${walletAddress}@wallet.local`;
    // 2. List auth users and try to find by:
    //    - exact wallet-email (for previously created wallet users)
    //    - OR user_metadata.wallet_address === walletAddress (for oauth users we've linked previously)
    const { data: usersList, error: listErr } =
      await admin.auth.admin.listUsers();
    if (listErr) throw listErr;
    const foundUser =
      usersList?.users.find(
        (u) =>
          u.email === walletEmail ||
          (u.user_metadata && u.user_metadata.wallet_address === walletAddress)
      ) ?? null;
    let authUser;
    if (!foundUser) {
      // 3a. No existing user found — create new deterministic wallet auth user
      const { data: createData, error: createErr } =
        await admin.auth.admin.createUser({
          email: walletEmail,
          email_confirm: true,
          user_metadata: { wallet_address: walletAddress },
        });
      if (createErr) throw createErr;
      authUser = createData.user;
    } else {
      // 3b. User exists (possibly from OAuth). If it lacks wallet metadata, attach it.
      authUser = foundUser;
      const userHasWalletInMetadata = !!authUser.user_metadata?.wallet_address;
      if (!userHasWalletInMetadata) {
        // Update the existing auth user to add wallet metadata so next lookups match.
        const { data: updated, error: updateErr } =
          await admin.auth.admin.updateUserById(authUser.id, {
            user_metadata: {
              ...(authUser.user_metadata ?? {}),
              wallet_address: walletAddress,
            },
          });
        if (updateErr) {
          // non-fatal: log and continue, but surface the error when appropriate
          console.warn(
            "Failed to attach wallet metadata to existing user:",
            updateErr
          );
        } else {
          authUser = updated.user ?? authUser;
        }
      }
    }
    // 4. Upsert into public.users table (server client, respecting cookies/session)
    const supabase = await createSupabaseServerClient();
    const { data: profile, error: upsertError } = await supabase
      .from("users")
      .upsert(
        {
          id: authUser.id,
          wallet_address: walletAddress,
          name: authUser.user_metadata?.name ?? "Anonymous User",
          email: authUser.email ?? walletEmail,
          avatar_url: authUser.user_metadata?.avatar_url ?? null,
        },
        { onConflict: "id" }
      )
      .select()
      .single();
    if (upsertError) throw upsertError;
    // 5. Return final profile (client should handle session creation / navigation)
    return NextResponse.json({ success: true, user: profile });
  } catch (err) {
    console.error("Wallet auth route error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
