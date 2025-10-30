import { NextRequest, NextResponse } from 'next/server';
import { writeContract } from '@wagmi/core'; // Server-side viem
import  iStoryTokenABI  from '@/lib/abis/iStoryToken.json';
import { config } from '@/lib/wagmi.config';

export async function POST(req: NextRequest) {
  try {
    const { to, amount, storyId } = await req.json();
    // In prod: Verify signer via headers
    const hash = await writeContract(config, {
      address: '0xYouriStoryTokenAddress', // Deployed
      abi: iStoryTokenABI.abi,
      functionName: 'tipCreator',
      args: [to as `0x${string}`, BigInt(amount * 1e18), BigInt(storyId)],
    });
    // Update Convex here (e.g., add tip record)
    return NextResponse.json({ success: true, hash });
  } catch (error) {
    console.log(error);

    return NextResponse.json({ error: 'Tip failed' }, { status: 500 });
  }
}