import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/app/utils/supabase/supabaseAdmin";
import { verifyMessage, type Address, isHex } from "viem";
import { verifyNonce } from "@/app/api/auth/nonce/route";

/**
 * Wallet login route (server)
 *
 * Flow:
 * 1. Client fetches nonce from /api/auth/nonce?address=0x...
 * 2. Client signs the message containing the nonce
 * 3. Client sends address + signature + message to this endpoint
 * 4. Server verifies signature AND nonce (replay prevention)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, signature, message } = body ?? {};

    // 1. Rigorous runtime validation for the signature format.
    if (!address || !signature || !message) {
      return NextResponse.json(
        { error: "Missing address, signature, or message." },
        { status: 400 }
      );
    }

    if (typeof signature !== 'string' || !isHex(signature)) {
        return NextResponse.json(
            { error: "The provided signature was not a valid hexadecimal string." },
            { status: 400 }
        );
    }
    const validatedSignature = signature as `0x${string}`;
    const validatedAddress = address as Address;

    // 2. Verify wallet signature using the validated inputs
    const isValid = await verifyMessage({
      address: validatedAddress,
      message,
      signature: validatedSignature,
    });

    if (!isValid) {
      return NextResponse.json({ error: "Signature verification failed." }, { status: 401 });
    }

    // 3. Verify nonce (replay prevention)
    const nonceResult = verifyNonce(address, message);
    if (!nonceResult.valid) {
      return NextResponse.json(
        { error: nonceResult.error || "Invalid nonce" },
        { status: 401 }
      );
    }

    const admin = createSupabaseAdminClient();
    const walletAddress = validatedAddress.toLowerCase();
    const walletEmail = `${walletAddress}@wallet.local`;

    // 4. Find existing user by direct query (not paginated list iteration)
    const { data: existingAuthUser } = await admin
      .from("users")
      .select("id, wallet_address")
      .eq("wallet_address", walletAddress)
      .maybeSingle();

    // Also check Supabase auth by email
    let authUser = null;

    // Find auth user by email or wallet metadata
    const { data: { users: matchedUsers } } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });

    const foundUser = matchedUsers?.find(
      (u) =>
        u.email === walletEmail ||
        (u.user_metadata && u.user_metadata.wallet_address === walletAddress)
    );

    if (!foundUser) {
      // 5a. No existing user found — create a new one.
      const { data: createData, error: createErr } =
        await admin.auth.admin.createUser({
          email: walletEmail,
          email_confirm: true,
          user_metadata: { wallet_address: walletAddress },
        });
      if (createErr) throw createErr;
      authUser = createData.user;
    } else {
      // 5b. User exists. If they don't have wallet metadata, add it.
      authUser = foundUser;
      if (!authUser.user_metadata?.wallet_address) {
        const { data: updated, error: updateErr } =
          await admin.auth.admin.updateUserById(authUser.id, {
            user_metadata: {
              ...(authUser.user_metadata ?? {}),
              wallet_address: walletAddress,
            },
          });
        if (updateErr) {
          console.warn("Failed to attach wallet metadata:", updateErr);
        } else {
          authUser = updated.user ?? authUser;
        }
      }
    }

    // 6. Check if a Google-auth user exists with matching wallet
    const { data: existingByWallet } = await admin
      .from("users")
      .select("*")
      .eq("wallet_address", walletAddress)
      .maybeSingle();

    let profile;
    if (existingByWallet && existingByWallet.id !== authUser.id) {
      // Existing user found by wallet — update with auth user id link
      const { data: updated, error: updateErr } = await admin
        .from("users")
        .update({
          auth_provider: existingByWallet.google_id ? "both" : "wallet",
        })
        .eq("id", existingByWallet.id)
        .select()
        .maybeSingle();
      if (updateErr) throw updateErr;
      profile = updated;
    } else {
      // Upsert into public.users
      const isNew = !existingByWallet;
      const { data: upserted, error: upsertError } = await admin
        .from("users")
        .upsert(
          {
            id: authUser.id,
            wallet_address: walletAddress,
            name: authUser.user_metadata?.name ?? authUser.user_metadata?.full_name ?? null,
            email: authUser.email,
            avatar: authUser.user_metadata?.avatar_url ?? null,
            auth_provider: "wallet",
            is_onboarded: isNew ? false : undefined,
          },
          { onConflict: "id", ignoreDuplicates: false }
        )
        .select()
        .maybeSingle();

      if (upsertError) throw upsertError;
      profile = upserted;
    }

    // 7. Generate a session token so the client can create a Supabase session.
    //    Wallet ownership was already verified via signature above, so this is safe.
    let sessionToken = null;
    let sessionEmail = null;

    // Determine which auth user the session should be for.
    // If the users row has a different ID, try to find the original auth user
    // so the session user.id matches users.id (prevents 403 on API calls).
    let sessionAuthUser = authUser;
    if (profile && profile.id !== authUser.id) {
      try {
        const { data: { user: originalAuth } } =
          await admin.auth.admin.getUserById(profile.id);
        if (originalAuth) {
          sessionAuthUser = originalAuth;
        }
      } catch {
        // Original auth user not found — use current authUser
      }
    }

    try {
      const { data: linkData, error: linkErr } =
        await admin.auth.admin.generateLink({
          type: "magiclink",
          email: sessionAuthUser.email!,
        });
      if (!linkErr && linkData?.properties) {
        sessionToken = linkData.properties.email_otp;
        sessionEmail = sessionAuthUser.email;
      }
    } catch (linkErr) {
      console.error("[AUTH LOGIN] Failed to generate session token:", linkErr);
    }

    return NextResponse.json({
      success: true,
      user: profile,
      session_token: sessionToken,
      session_email: sessionEmail,
    });

  } catch (err: unknown) {
    console.error("Wallet auth route error:", err);
    return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
  }
}
