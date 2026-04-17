import { NextRequest, NextResponse } from 'next/server';
import { writeContract } from '@wagmi/core';
import  eStoryTokenABI  from '@/lib/abis/iStoryToken.json';
import { config } from '@/lib/wagmi.config.server';
import { validateAuthOrReject, isAuthError } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/app/utils/supabase/supabaseAdmin";
import * as Sentry from "@sentry/nextjs";

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authResult = await validateAuthOrReject(req);
    if (isAuthError(authResult)) return authResult;
    const senderUserId = authResult;

    const { to, amount, storyId } = await req.json();

    if (!to || !amount || !storyId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const hash = await writeContract(config, {
      address: process.env.NEXT_PUBLIC_ESTORY_TOKEN_ADDRESS as `0x${string}`,
      abi: eStoryTokenABI.abi,
      functionName: 'tipCreator',
      args: [to as `0x${string}`, BigInt(amount * 1e18), BigInt(storyId)],
    });

    // Best-effort notification for the recipient — never block the response on it.
    try {
      const admin = createSupabaseAdminClient();
      const recipientWallet = String(to).toLowerCase();

      const { data: recipient } = await admin
        .from("users")
        .select("id")
        .eq("wallet_address", recipientWallet)
        .maybeSingle();

      if (recipient?.id && recipient.id !== senderUserId) {
        const { data: sender } = await admin
          .from("users")
          .select("name, username")
          .eq("id", senderUserId)
          .single();

        const senderName = sender?.name || sender?.username || "Someone";
        const senderHandle = sender?.username ? `@${sender.username}` : null;

        const { error: notifErr } = await admin.from("notifications").insert({
          user_id: recipient.id,
          type: "tip",
          title: "You received a tip",
          message: senderHandle
            ? `${senderName} (${senderHandle}) tipped you ${amount} $STORY. Thank them in the comments!`
            : `${senderName} tipped you ${amount} $STORY. Thank them in the comments!`,
          related_user_id: senderUserId,
          story_id: String(storyId),
          link: `/story/${storyId}`,
          read: false,
          metadata: { amount, tx_hash: hash },
        });

        if (notifErr) {
          console.error("[TIP] notification insert error:", notifErr);
          Sentry.captureException(notifErr, { tags: { area: "tip.notification" } });
        }
      }
    } catch (notifErr) {
      console.error("[TIP] notification create failed:", notifErr);
    }

    return NextResponse.json({ success: true, hash });
  } catch (error) {
    console.error("[TIP] Error:", error);
    return NextResponse.json({ error: 'Tip failed' }, { status: 500 });
  }
}
