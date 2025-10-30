"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useAccount, useBalance } from "wagmi";
import { supabaseClient } from "@/app/utils/supabase/supabaseClient";
import type { User, Session } from "@supabase/supabase-js";

export interface UnifiedUserProfile {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  wallet_address: string | null;
  balance: string;
  isConnected: boolean;
  supabaseUser: User | null;
}

const AuthContext = createContext<UnifiedUserProfile | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = supabaseClient;
  const [profile, setProfile] = useState<UnifiedUserProfile | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [needsOAuthLink, setNeedsOAuthLink] = useState(false);

  const { address, isConnected, chainId } = useAccount();
  const { data: ethBalance } = useBalance({ address });

  useEffect(() => {
    const fetchInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) console.error("Error fetching initial session:", error.message);
      await handleSession(session);
    };
    fetchInitialSession();
  }, [supabase]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await handleSession(session);
    });
    return () => subscription.unsubscribe();
  }, [isConnected, address, ethBalance, supabase]);

  useEffect(() => {
    const syncUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) return;
      if (!isConnected || !address || chainId === undefined) return;
      setIsSigningIn(true);
      try {
        const { data: web3Data, error: web3Error } = await supabase.auth.signInWithWeb3({
          chain: 'ethereum',
          statement: 'Welcome to IStory - AI-Powered Blockchain Journaling DApp. Sign this message to authenticate.',
        });
        if (web3Error) throw web3Error;
        console.log("Web3 sign-in successful:", web3Data);
        setNeedsOAuthLink(true);
      } catch (err) {
        console.error("Sign-in failed:", err);
      } finally {
        setIsSigningIn(false);
      }
    };
    syncUser();
  }, [isConnected, address, chainId, supabase]);

  useEffect(() => {
    const linkGoogle = async () => {
      if (!needsOAuthLink) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || session.user.email) {
        setNeedsOAuthLink(false);
        return;
      }
      // Delay to ensure session is fully set
      await new Promise(resolve => setTimeout(resolve, 500));
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        console.log("Directed to Google OAuth for linking:", data);
      } catch (err) {
        console.error("OAuth linking failed:", err);
      } finally {
        setNeedsOAuthLink(false);
      }
    };
    linkGoogle();
  }, [needsOAuthLink, supabase]);

  const handleSession = async (session: Session | null) => {
    setTimeout(async () => {
      if (session?.user) {
        const { data: refreshedProfile, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();
        if (error) console.error("Refresh profile error:", error.message);
        if (refreshedProfile) {
          setProfile({
            ...refreshedProfile,
            isConnected,
            balance: ethBalance?.formatted ?? "0",
            wallet_address: address?.toLowerCase() ?? refreshedProfile.wallet_address,
            supabaseUser: session.user,
          });
        }
      }
    }, 1000);

    if (session?.user) {
      let { data: userProfile, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();
      console.log("Fetched User Profile:", userProfile);
      if (error || !userProfile) {
        console.log("Creating new profile for user ID:", session.user.id);
        const insertData = {
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || "Anonymous User",
          email: session.user.email ?? null,
          avatar: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null,
          wallet_address: address?.toLowerCase() ?? null,
        };
        const { data: newProfile, error: insertError } = await supabase
          .from("users")
          .insert(insertData)
          .select("*")
          .maybeSingle();
        if (insertError) {
          if (insertError.code === '23505' && insertError.message.includes('users_wallet_address_key')) {
            console.log("Duplicate wallet_address; attempting merge.");
            try {
              const res = await fetch("/api/merge-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ new_user_id: session.user.id, wallet_address: address?.toLowerCase() }),
              });
              if (!res.ok) throw new Error(await res.text());
              console.log("Merge successful; refreshing profile.");
              const { data: mergedProfile, error: mergeFetchError } = await supabase
                .from("users")
                .select("*")
                .eq("id", session.user.id)
                .single();
              if (mergeFetchError) throw mergeFetchError;
              if (mergedProfile) {
                setProfile({
                  ...mergedProfile,
                  isConnected,
                  balance: ethBalance?.formatted ?? "0",
                  wallet_address: address?.toLowerCase() ?? mergedProfile.wallet_address,
                  supabaseUser: session.user,
                });
                return;
              }
            } catch (mergeErr) {
              console.error("Merge failed:", mergeErr);
            }
          }
          console.error("Error creating user profile:", insertError.message, insertError.details, insertError.hint);
          setProfile({
            id: session.user.id,
            name: "Anonymous User",
            email: null,
            avatar: null,
            wallet_address: null,
            balance: ethBalance?.formatted ?? "0",
            isConnected,
            supabaseUser: session.user,
          });
          return;
        }
        userProfile = newProfile;
      }
      setProfile({
        ...userProfile,
        isConnected,
        balance: ethBalance?.formatted ?? "0",
        wallet_address: address?.toLowerCase() ?? userProfile?.wallet_address,
        supabaseUser: session.user,
      });
      console.log("Unified Profile Set:", {
        ...userProfile,
        isConnected,
        balance: ethBalance?.formatted ?? "0",
        wallet_address: address?.toLowerCase() ?? userProfile?.wallet_address,
        supabaseUser: session.user,
      });
    } else {
      if (isSigningIn) {
        console.log("Sign-in in progress; skipping fallback fetch.");
        return;
      }
      if (isConnected && address) {
        const { data: userProfile, error } = await supabase
          .from("users")
          .select("*")
          .eq("wallet_address", address.toLowerCase())
          .maybeSingle();
        if (error) {
          console.error("Error fetching profile by wallet_address:", error.message);
          setProfile(null);
          return;
        }
        if (userProfile) {
          console.log("Fetched User Profile by wallet_address:", userProfile);
          setProfile({
            ...userProfile,
            isConnected,
            balance: ethBalance?.formatted ?? "0",
            wallet_address: address.toLowerCase(),
            supabaseUser: null,
          });
        } else {
          console.warn("No profile found by wallet_address; sign-in required to create.");
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
    }
  };

  useEffect(() => {
    if (profile && isConnected && address && !profile.wallet_address) {
      supabase
        .from("users")
        .update({ wallet_address: address.toLowerCase() })
        .eq("id", profile.id)
        .then(({ error }) => {
          if (error)
            console.error(
              "Failed to link wallet:",
              error.message,
              error.details
            );
          else console.log("Wallet linked");
        });
    }
  }, [profile, isConnected, address, supabase]);

  return (
    <AuthContext.Provider value={profile}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);