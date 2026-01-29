import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/app/utils/supabase/supabaseAdmin";
import { verifyMessage, type Address, isHex } from "viem";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Finds a user by iterating through all paginated results from Supabase Auth.
 * This is necessary because `listUsers` is paginated (default 50 per page).
 *
 * @param admin - The Supabase admin client.
 * @param walletEmail - The deterministic email generated from the wallet address.
 * @param walletAddress - The user's wallet address.
 * @returns The found user object or null if not found.
 */
async function findUserInPaginatedList(
  admin: SupabaseClient,
  walletEmail: string,
  walletAddress: string
) {
  let page = 1;
  const perPage = 100; // Fetch 100 users per page for better efficiency
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const foundUser = data.users.find(
      (u) =>
        u.email === walletEmail ||
        (u.user_metadata && u.user_metadata.wallet_address === walletAddress)
    );

    if (foundUser) {
      return foundUser;
    }

    // If this page was the last one, stop the loop
    if (data.users.length < perPage) {
      break;
    }

    page++;
  }
  return null;
}


/**
 * Wallet login route (server)
 *
 * This version includes a critical fix for finding users in a paginated list,
 * which resolves the "Database error creating new user" error when the user
 * count exceeds the default page size (50).
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
        console.error("Invalid signature format received from client:", signature);
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

    const admin = createSupabaseAdminClient();
    const walletAddress = validatedAddress.toLowerCase();
    const walletEmail = `${walletAddress}@wallet.local`;

    // 3. Find existing Supabase auth user using the paginated helper function
    const foundUser = await findUserInPaginatedList(admin, walletEmail, walletAddress);

    let authUser;
    if (!foundUser) {
      // 4a. No existing user found — create a new one.
      const { data: createData, error: createErr } =
        await admin.auth.admin.createUser({
          email: walletEmail,
          email_confirm: true,
          user_metadata: { wallet_address: walletAddress },
        });
      if (createErr) throw createErr;
      authUser = createData.user;
    } else {
      // 4b. User exists. If they don't have wallet metadata, add it.
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

    // 5. Check if a Google-auth user exists with matching wallet email
    //    If so, link accounts instead of creating duplicate
    const walletEmail2 = authUser.email; // The wallet@wallet.local email
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
        .single();
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
        .single();

      if (upsertError) throw upsertError;
      profile = upserted;
    }

    // 6. Return the final, updated profile
    return NextResponse.json({ success: true, user: profile });

  } catch (err: any) {
    console.error("Wallet auth route error:", err.message, err.stack);
    return NextResponse.json({ error: err.message || "An internal server error occurred" }, { status: 500 });
  }
}