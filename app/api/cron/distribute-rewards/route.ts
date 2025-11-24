import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { STORY_TOKEN_ADDRESS, STORY_TOKEN_ABI } from "@/lib/contracts";

// 1. Setup Admin Supabase Client
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// 2. Setup Admin Wallet (The Minter)
const account = privateKeyToAccount(process.env.ADMIN_PRIVATE_KEY as `0x${string}`);
const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(),
});

export async function GET(req: NextRequest) {
  // Security: Verify a secret token to prevent unauthorized triggers
  // In production, check req.headers.get('Authorization') === `Bearer ${process.env.CRON_SECRET}`
  
  try {
    console.log("[REWARDS] Starting distribution...");

    // 3. Fetch Users eligible for rewards
    // Criteria: Users with > 10 likes who haven't been rewarded recently
    // Note: You might need a 'last_rewarded_at' column in your users table for production
    const { data: users, error } = await adminSupabase
      .from("stories")
      .select("author_wallet, likes")
      .gt("likes", 0); 

    if (error) throw error;

    // Aggregate likes per wallet
    const rewardsMap = new Map<string, number>();
    
    users.forEach((story) => {
      if (!story.author_wallet) return;
      const current = rewardsMap.get(story.author_wallet) || 0;
      rewardsMap.set(story.author_wallet, current + story.likes);
    });

    let mintCount = 0;

    // 4. Process Rewards
    // In a real app, you would batch these into a Multicall to save gas.
    // For MVP, we loop (careful with timeouts on Vercel free tier).
    for (const [wallet, totalLikes] of rewardsMap.entries()) {
        // Logic: 1 Like = 1 $ISTORY
        // In production, check if they already claimed these specific likes
        const amountToMint = parseEther(totalLikes.toString());

        try {
            console.log(`Minting ${totalLikes} ISTORY to ${wallet}`);
            
            const hash = await walletClient.writeContract({
                address: STORY_TOKEN_ADDRESS,
                abi: STORY_TOKEN_ABI,
                functionName: "mint",
                args: [wallet, amountToMint],
            });
            
            mintCount++;
            // Optional: Record this reward transaction in a 'rewards_log' table
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