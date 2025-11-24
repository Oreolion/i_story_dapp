import { NextRequest, NextResponse } from "next/server";
import { publicClient } from "@/lib/viemClient";
import { createSupabaseAdminClient } from "@/app/utils/supabase/supabaseAdmin";
import { decodeEventLog, parseAbiItem } from "viem";
import { STORY_PROTOCOL_ADDRESS } from "@/lib/contracts";

const UNLOCK_EVENT_ABI = parseAbiItem(
  "event ContentUnlocked(address indexed payer, address indexed author, uint256 amount, uint256 indexed contentId)"
);

export async function POST(req: NextRequest) {
  try {
    const { txHash, userWallet } = await req.json();

    if (!txHash || !userWallet) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    console.log(`Verifying TX: ${txHash} for user ${userWallet}`);

    // 1. Fetch Transaction Receipt from Blockchain
    const receipt = await publicClient.getTransactionReceipt({ 
      hash: txHash as `0x${string}` 
    });

    if (receipt.status !== "success") {
      return NextResponse.json({ error: "Transaction failed on-chain" }, { status: 400 });
    }

    // 2. Find the 'ContentUnlocked' event in the logs
    let unlockEvent = null;
    
    for (const log of receipt.logs) {
      try {
        // Check if log belongs to our protocol contract
        if (log.address.toLowerCase() !== STORY_PROTOCOL_ADDRESS.toLowerCase()) continue;

        const decoded = decodeEventLog({
          abi: [UNLOCK_EVENT_ABI],
          data: log.data,
          topics: log.topics,
        });

        if (decoded.eventName === "ContentUnlocked") {
          unlockEvent = decoded.args;
          break;
        }
      } catch (e) {
        // Not our event, skip
        continue;
      }
    }

    if (!unlockEvent) {
      return NextResponse.json({ error: "No Unlock event found in transaction" }, { status: 400 });
    }

    // 3. Update Supabase (Grant Access)
    // We verified the user actually paid. Now we unlock it in the DB.
    const adminSupabase = createSupabaseAdminClient();
    const storyIdNumeric = unlockEvent.contentId.toString();
    
    // A. Find the Story UUID using the numeric_id from the event
    const { data: story, error: storyError } = await adminSupabase
      .from('stories')
      .select('id')
      .eq('numeric_id', storyIdNumeric)
      .single();

    if (storyError || !story) {
       return NextResponse.json({ error: "Story not found in DB" }, { status: 404 });
    }

    // B. Find the User UUID
    const { data: user } = await adminSupabase
      .from('users')
      .select('id')
      .eq('wallet_address', userWallet.toLowerCase())
      .single();

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // C. Insert 'unlock' record
    // You need a table 'unlocked_content' (user_id, story_id)
    const { error: insertError } = await adminSupabase
      .from('unlocked_content')
      .upsert({
        user_id: user.id,
        story_id: story.id,
        tx_hash: txHash,
        unlocked_at: new Date().toISOString()
      }, { onConflict: 'user_id, story_id' });

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, storyId: story.id });

  } catch (error: any) {
    console.error("Verification Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}