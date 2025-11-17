// components/AuthProvider.tsx (replace your file with this)
"use client";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAccount, useBalance } from "wagmi";
import type { User, Session } from "@supabase/supabase-js";
import { getBrowserSupabase } from "@/app/utils/supabase/browserClient";

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = getBrowserSupabase(); // singleton
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address });

  const [profile, setProfile] = useState<UnifiedUserProfile | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const signInAttemptRef = useRef(false); // prevents loops

  // 1) load initial session once
  useEffect(() => {
    if (!supabase) { setIsSessionLoading(false); return; }
    let mounted = true;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        if (session?.user) {
          // set profile via helper below
          await handleSession(session);
        }
      } catch (err) {
        console.error("[AUTH] initial getSession error:", err);
      } finally {
        if (mounted) setIsSessionLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [supabase]);

  // 2) subscribe for auth changes (will handle sign-in completion)
  useEffect(() => {
    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // console.log("[AUTH] onAuthStateChange", _event);
      handleSession(session || null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  // helper that fetches/creates profile
  const handleSession = async (session: Session | null) => {
    if (!supabase) return;
    if (session?.user) {
      try {
        const { data: userProfile, error } = await supabase?.from("users")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();
        if (error) {
          console.error("[AUTH] fetch profile error:", error);
          setProfile(null);
          return;
        }
        if (userProfile) {
          setProfile({
            ...userProfile,
            isConnected: Boolean(isConnected),
            balance: ethBalance?.formatted ?? "0",
            wallet_address: (userProfile.wallet_address ?? address ?? null),
            supabaseUser: session.user,
          });
        } else {
          // optional: create profile or leave null
          setProfile(null);
        }
      } catch (err) {
        console.error("[AUTH] handleSession unexpected:", err);
        setProfile(null);
      }
    } else {
      setProfile(null);
    }
  };

  // 3) sync wallet -> supabase: only attempt sign-in once, after initial session check
  useEffect(() => {
    if (!supabase) return;
    if (isSessionLoading) return; // wait for initial session read
    if (profile) return; // already signed in
    if (!isConnected || !address) return; // no wallet
    if (signInAttemptRef.current) return; // already attempted

    // start attempt
    signInAttemptRef.current = true;
    (async () => {
      try {
        console.log("[AUTH] Triggering signInWithWeb3...");
        const { error } = await supabase.auth.signInWithWeb3({
          chain: "ethereum",
          statement: "Sign to authenticate to IStory.",
        });
        if (error) {
          // if error includes "URI", log and do not retry
          console.error("[AUTH] signInWithWeb3 error:", error);
          // optionally show a toast telling dev to set Site URL in Supabase
        } else {
          // success — onAuthStateChange will catch it and run handleSession
          console.log("[AUTH] signInWithWeb3 success (waiting for session event).");
        }
      } catch (err: any) {
        console.error("[AUTH] signInWithWeb3 failed:", err?.message ?? err);
      } finally {
        // allow future manual attempts (do not auto-loop)
        setTimeout(() => {
          signInAttemptRef.current = false;
        }, 2000); // small cooldown
      }
    })();
  }, [isSessionLoading, profile, isConnected, address, supabase, ethBalance]);

  return <AuthContext.Provider value={profile}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
