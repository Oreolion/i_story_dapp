import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { STORY_TOKEN_ADDRESS, STORY_TOKEN_ABI } from "@/lib/contracts";

// Force dynamic to prevent static generation attempts
export const dynamic = 'force-dynamic';

// 1. Setup Admin Supabase Client (Safe to be top-level)
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(req: NextRequest) {
  try {
    console.log("[REWARDS] Starting distribution...");

    // 2. Setup Admin Wallet (MOVED INSIDE to prevent build errors)
    // This ensures we only check for the key when the route is actually hit
    const privateKey = process.env.ADMIN_PRIVATE_KEY;

    if (!privateKey) {
        console.error("Missing ADMIN_PRIVATE_KEY");
        return NextResponse.json({ error: "Server misconfigured: Missing Admin Key" }, { status: 500 });
    }

    // Initialize Viem Client only at runtime
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(),
    });

    // 3. Fetch Users eligible for rewards
    const { data: users, error } = await adminSupabase
      .from("stories")
      .select("author_wallet, likes")
      .gt("likes", 0); 

    if (error) throw error;

    // Aggregate likes per wallet
    const rewardsMap = new Map<string, number>();
    
    users?.forEach((story) => {
      if (!story.author_wallet) return;
      const current = rewardsMap.get(story.author_wallet) || 0;
      rewardsMap.set(story.author_wallet, current + story.likes);
    });

    let mintCount = 0;

    // 4. Process Rewards
    for (const [wallet, totalLikes] of rewardsMap.entries()) {
        const amountToMint = parseEther(totalLikes.toString());

        try {
            console.log(`Minting ${totalLikes} ISTORY to ${wallet}`);
            
            await walletClient.writeContract({
                address: STORY_TOKEN_ADDRESS as `0x${string}`,
                abi: STORY_TOKEN_ABI,
                functionName: "mint",
                args: [wallet as `0x${string}`, amountToMint],
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

  } catch (error: any) {
    console.error("[REWARDS] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}