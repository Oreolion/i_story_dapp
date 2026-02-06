import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/app/utils/supabase/supabaseAdmin";
import { validateAuthOrReject, isAuthError, validateWalletOwnership } from "@/lib/auth";

/**
 * GET /api/social/follow?follower_wallet=0x...&followed_wallets=0x...,0x...
 * Check follow status for one or more wallets.
 * Returns: { following: { [wallet]: boolean } }
 */
export async function GET(req: NextRequest) {
  try {
    // Auth check
    const authResult = await validateAuthOrReject(req);
    if (isAuthError(authResult)) return authResult;

    const { searchParams } = new URL(req.url);
    const followerWallet = searchParams.get("follower_wallet")?.toLowerCase();
    const followedWalletsParam = searchParams.get("followed_wallets");

    if (!followerWallet || !followedWalletsParam) {
      return NextResponse.json(
        { error: "Missing follower_wallet or followed_wallets" },
        { status: 400 }
      );
    }

    const followedWallets = followedWalletsParam
      .split(",")
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean);

    if (followedWallets.length === 0) {
      return NextResponse.json({ following: {} });
    }

    const admin = createSupabaseAdminClient();

    const { data, error } = await admin
      .from("follows")
      .select("followed_wallet")
      .eq("follower_wallet", followerWallet)
      .in("followed_wallet", followedWallets);

    if (error) {
      console.error("[API /social/follow GET] error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    const followedSet = new Set(data?.map((r) => r.followed_wallet) || []);
    const following: Record<string, boolean> = {};
    for (const wallet of followedWallets) {
      following[wallet] = followedSet.has(wallet);
    }

    return NextResponse.json({ following });
  } catch (err: unknown) {
    console.error("[API /social/follow GET] unexpected:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/social/follow
 * Toggle follow/unfollow.
 * Body: { follower_wallet: string, followed_wallet: string }
 * Returns: { isFollowing: boolean, followers_count: number }
 */
export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authResult = await validateAuthOrReject(req);
    if (isAuthError(authResult)) return authResult;
    const authenticatedUserId = authResult;

    const body = await req.json();
    const followerWallet = body.follower_wallet?.toLowerCase();
    const followedWallet = body.followed_wallet?.toLowerCase();

    if (!followerWallet || !followedWallet) {
      return NextResponse.json(
        { error: "Missing follower_wallet or followed_wallet" },
        { status: 400 }
      );
    }

    if (followerWallet === followedWallet) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 }
      );
    }

    // Verify authenticated user owns the follower wallet
    const ownsWallet = await validateWalletOwnership(authenticatedUserId, followerWallet);
    if (!ownsWallet) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = createSupabaseAdminClient();

    // Check if already following
    const { data: existing } = await admin
      .from("follows")
      .select("id")
      .eq("follower_wallet", followerWallet)
      .eq("followed_wallet", followedWallet)
      .maybeSingle();

    let isFollowing: boolean;

    if (existing) {
      // === UNFOLLOW ===
      const { error: deleteErr } = await admin
        .from("follows")
        .delete()
        .eq("id", existing.id);

      if (deleteErr) {
        console.error("[API /social/follow] delete error:", deleteErr);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }

      // Decrement followers_count (floor at 0)
      const { data: userData } = await admin
        .from("users")
        .select("followers_count")
        .eq("wallet_address", followedWallet)
        .single();

      if (userData) {
        await admin
          .from("users")
          .update({ followers_count: Math.max(0, (userData.followers_count || 0) - 1) })
          .eq("wallet_address", followedWallet);
      }

      isFollowing = false;
    } else {
      // === FOLLOW ===
      const { error: insertErr } = await admin
        .from("follows")
        .insert({ follower_wallet: followerWallet, followed_wallet: followedWallet });

      if (insertErr) {
        console.error("[API /social/follow] insert error:", insertErr);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }

      // Increment followers_count
      const { data: userData } = await admin
        .from("users")
        .select("followers_count")
        .eq("wallet_address", followedWallet)
        .single();

      await admin
        .from("users")
        .update({ followers_count: (userData?.followers_count || 0) + 1 })
        .eq("wallet_address", followedWallet);

      // Create follow notification for the followed user
      const { data: followedUser } = await admin
        .from("users")
        .select("id")
        .eq("wallet_address", followedWallet)
        .single();

      const { data: followerUser } = await admin
        .from("users")
        .select("name, username")
        .eq("wallet_address", followerWallet)
        .single();

      if (followedUser && followerUser) {
        await admin.from("notifications").insert({
          user_id: followedUser.id,
          type: "follow",
          title: "New Follower",
          message: `${followerUser.name || followerUser.username || "Someone"} started following you`,
        });
      }

      isFollowing = true;
    }

    // Get updated followers count
    const { data: updatedUser } = await admin
      .from("users")
      .select("followers_count")
      .eq("wallet_address", followedWallet)
      .single();

    return NextResponse.json({
      isFollowing,
      followers_count: updatedUser?.followers_count || 0,
    });
  } catch (err: unknown) {
    console.error("[API /social/follow POST] unexpected:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
