'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { supabaseClient } from '@/app/utils/supabase/supabaseClient';
import type { User } from '@supabase/supabase-js';

// A unified profile that includes both database and live wallet data
export interface UnifiedUserProfile {
  // From Supabase `users` table
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  wallet_address: string | null;
  // From Wagmi (live)
  balance: string;
  isConnected: boolean;
  // Supabase Auth object
  supabaseUser: User | null;
}

const AuthContext = createContext<UnifiedUserProfile | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = supabaseClient;
  const [profile, setProfile] = useState<UnifiedUserProfile | null>(null);
  
  // Get live wallet data from Wagmi
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address });

  useEffect(() => {
    // This function runs whenever the Supabase auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          // User is logged in to Supabase. Fetch their profile from our `users` table.
          let { data: userProfile, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          console.log(userProfile); // For debugging

          if (fetchError || !userProfile) {
            // Handle fetch error or missing profile: Create a new row in `users`
            console.warn('No user profile found or fetch error; creating one:', fetchError?.message);
            const insertData = {
              id: session.user.id, // Must match auth user ID
              name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || 'Anonymous User',
              email: session.user.email ?? null,
              avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null,
              wallet_address: address?.toLowerCase() ?? null,
            };
            const { data: newProfile, error: insertError } = await supabase
              .from('users')
              .insert(insertData)
              .select('*')
              .single();

            if (insertError) {
              console.error('Error creating user profile:', insertError.message, insertError.details, insertError.hint);
              // Fallback partial profile to avoid null
              setProfile({
                id: session.user.id,
                name: 'Anonymous User',
                email: null,
                avatar_url: null,
                wallet_address: null,
                balance: ethBalance?.formatted ?? '0',
                isConnected,
                supabaseUser: session.user,
              });
              return;
            }
            userProfile = newProfile;
          }

          // Combine database profile with live wallet data
          setProfile({
            ...userProfile,
            isConnected, // from useAccount
            balance: ethBalance?.formatted ?? '0', // from useBalance
            wallet_address: address?.toLowerCase() ?? userProfile?.wallet_address,
            supabaseUser: session.user,
          });
          console.log("Unified Profile Set:", {
            ...userProfile,
            isConnected, 
            balance: ethBalance?.formatted ?? '0', 
            wallet_address: address?.toLowerCase() ?? userProfile?.wallet_address,
            supabaseUser: session.user,
          });
        } else {
          // User is logged out from Supabase
          setProfile(null);
        }
      }
    );

    // Cleanup subscription on component unmount
    return () => {
      subscription.unsubscribe();
    };
  // Rerun this effect if wallet connection state changes
  }, [isConnected, address, ethBalance, supabase]);

  useEffect(() => {
    if (profile && isConnected && address && !profile.wallet_address) {
      supabase.from('users').update({ wallet_address: address.toLowerCase() })
        .eq('id', profile.id)
        .then(({ error }) => {
          if (error) console.error('Failed to link wallet to users table:', error.message, error.details);
          else console.log('Wallet linked');
        });
    }
  }, [profile, isConnected, address, supabase]);

  return (
    <AuthContext.Provider value={profile}>
      {children}
    </AuthContext.Provider>
  );
}

// The custom hook your components will use to get the unified user profile
export const useAuth = () => {
  return useContext(AuthContext);
};