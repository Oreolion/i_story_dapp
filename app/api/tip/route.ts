import { NextRequest, NextResponse } from 'next/server';
import { writeContract } from '@wagmi/core';
import  iStoryTokenABI  from '@/lib/abis/iStoryToken.json';
import { config } from '@/lib/wagmi.config.server';
import { validateAuthOrReject, isAuthError } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authResult = await validateAuthOrReject(req);
    if (isAuthError(authResult)) return authResult;

    const { to, amount, storyId } = await req.json();

    if (!to || !amount || !storyId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const hash = await writeContract(config, {
      address: process.env.NEXT_PUBLIC_ISTORY_TOKEN_ADDRESS as `0x${string}`,
      abi: iStoryTokenABI.abi,
      functionName: 'tipCreator',
      args: [to as `0x${string}`, BigInt(amount * 1e18), BigInt(storyId)],
    });
    return NextResponse.json({ success: true, hash });
  } catch (error) {
    console.error("[TIP] Error:", error);
    return NextResponse.json({ error: 'Tip failed' }, { status: 500 });
  }
}
