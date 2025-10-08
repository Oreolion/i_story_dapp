import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/app/utils/supabase/supabaseServer'; 
import { verifyWalletSignature } from '@/app/utils/supabase/supabaseClient'; 


export async function POST(req: NextRequest) {
  const { address, signature, message } = await req.json();
  if (!address || !signature || !message) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }
  const isValid = await verifyWalletSignature(address as `0x${string}`, message, signature as `0x${string}`);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  const supabase = createSupabaseServerClient();
  const { data: user, error } = await supabase
    .from('users')
    .upsert({ wallet_address: address })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: 'User creation failed' }, { status: 500 });
  }
  // Set custom session (for RLS)
  const { error: authError } = await supabase.auth.setSession({
    access_token: 'custom-token-for-wallet', // Generate JWT if needed (use supabase.auth.signInWithIdToken for custom)
    refresh_token: 'dummy',
  });
  if (authError) {
    return NextResponse.json({ error: 'Auth session failed' }, { status: 500 });
  }
  return NextResponse.json({ success: true, user });
}