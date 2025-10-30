import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
  const { new_user_id, wallet_address } = await req.json();
  if (!new_user_id || !wallet_address) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: oldProfile, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('wallet_address', wallet_address.toLowerCase())
    .single();

  if (fetchError || !oldProfile) {
    return NextResponse.json({ error: 'No existing profile found' }, { status: 404 });
  }

  const old_user_id = oldProfile.id;

  if (old_user_id === new_user_id) {
    return NextResponse.json({ message: 'Already matched' }, { status: 200 });
  }

  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({ id: new_user_id })
    .eq('id', old_user_id);

  if (updateError) {
    return NextResponse.json({ error: 'Update failed: ' + updateError.message }, { status: 500 });
  }

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(old_user_id);

  if (deleteError) {
    await supabaseAdmin.from('users').update({ id: old_user_id }).eq('id', new_user_id); // Rollback
    return NextResponse.json({ error: 'Delete old user failed: ' + deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Merged successfully' }, { status: 200 });
}