import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { STORY_TOKEN_ADDRESS, STORY_TOKEN_ABI } from "@/lib/contracts";
import { safeCompare } from "@/lib/crypto";

// Force dynamic to prevent build-time execution
export const dynamic = 'force-dynamic';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(req: NextRequest) {
  // 1. SECURITY: Check for Vercel Cron Secret (timing-safe comparison)
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || !authHeader || !safeCompare(authHeader, `Bearer ${cronSecret}`)) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log("[REWARDS] Starting distribution...");

    // 2. Setup Admin Wallet (Runtime only)
    const privateKey = process.env.ADMIN_PRIVATE_KEY;
    if (!privateKey) {
        return NextResponse.json({ error: "Server config error: Missing Admin Key" }, { status: 500 });
    }

    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(),
    });

    // 3. Fetch Eligible Users (Logic: Has received likes)
    const { data: users, error } = await adminSupabase
      .from("stories")
      .select("author_wallet, likes")
      .gt("likes", 0); 

    if (error) throw error;

    // 4. Aggregate Likes per Wallet
    const rewardsMap = new Map<string, number>();
    
    users?.forEach((story) => {
      if (!story.author_wallet) return;
      // Simple logic: 1 Like = 1 Token.
      const current = rewardsMap.get(story.author_wallet) || 0;
      rewardsMap.set(story.author_wallet, current + story.likes);
    });

    let mintCount = 0;

    // 5. Batch Minting Loop
    for (const [wallet, totalLikes] of rewardsMap.entries()) {
        // Threshold: Only mint if they have > 5 likes to save gas
        if(totalLikes < 5) continue;

        const amountToMint = parseEther(totalLikes.toString());

        try {
            console.log(`Minting ${totalLikes} ISTORY to ${wallet}`);
            
            await walletClient.writeContract({
                address: STORY_TOKEN_ADDRESS as `0x${string}`,
                abi: STORY_TOKEN_ABI,
                functionName: "mint",
                args: [wallet as `0x${string}`, amountToMint],
                gas: BigInt(200_000), // Explicit gas limit
            });
            
            mintCount++;
        } catch (err) {
            console.error(`Failed to mint for ${wallet}:`, err);
        }
    }

    return NextResponse.json({ 
        success: true, 
        usersRewarded: mintCount,
        message: "Rewards distributed successfully" 
    });

  } catch (error: unknown) {
    console.error("[REWARDS] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}