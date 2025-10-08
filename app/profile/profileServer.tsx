import { createSupabaseServerClient } from '@/app/utils/supabase/supabaseServer';

export async function ProfileServer({ walletAddress }: { walletAddress: string | undefined }) {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  let profileData = null;
  if (session && walletAddress) {
    const { data } = await supabase.from('users').select('*').eq('wallet_address', walletAddress).single();
    profileData = data;
  }
  return { initialProfile: profileData, isSignedIn: !!session };
}