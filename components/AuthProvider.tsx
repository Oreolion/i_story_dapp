// components/AuthProvider.tsx
"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAccount, useBalance, useSignMessage } from "wagmi";
import type { User, Session } from "@supabase/supabase-js";
import { supabaseClient } from "@/app/utils/supabase/supabaseClient"; // ← YOUR ORIGINAL CLIENT (kept exactly)

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
  const supabase = supabaseClient; // ← YOUR ORIGINAL WORKING CLIENT
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address });
  const { signMessageAsync } = useSignMessage();

  const [profile, setProfile] = useState<UnifiedUserProfile | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const signInAttemptRef = useRef(false);

  const setUnifiedProfile = (userRow: any, sessionUser: User | null) => {
    if (!userRow) return setProfile(null);
    setProfile({
      id: userRow.id,
      name: userRow.name ?? null,
      email: userRow.email ?? null,
      avatar: userRow.avatar ?? null,
      wallet_address:
        (userRow.wallet_address ?? address ?? null)?.toLowerCase?.() ?? null,
      balance: ethBalance?.formatted ?? "0",
      isConnected: Boolean(isConnected),
      supabaseUser: sessionUser,
    });
  };

  useEffect(() => {
    if (!supabase) {
      setIsSessionLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!mounted) return;
        if (session?.user) {
          await handleSession(session);
        }
      } catch (err) {
        console.error("[AUTH] initial getSession error:", err);
      } finally {
        if (mounted) setIsSessionLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session || null).catch((e) =>
        console.error("[AUTH] onAuthStateChange error:", e)
      );
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSession = async (session: Session | null) => {
    if (!supabase) return;
    if (!session?.user) {
      setProfile(null);
      return;
    }
    const sessionWalletAddress =
      (session.user.user_metadata?.wallet_address as string | undefined) ||
      (address ?? null);
    const walletLower = sessionWalletAddress?.toLowerCase?.() ?? null;
    try {
      const { data: userProfile, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();
      if (error) console.error("[AUTH] fetch profile by id error:", error);
      if (userProfile) {
        setUnifiedProfile(userProfile, session.user);
        return;
      }
      const insertPayload = {
        id: session.user.id,
        wallet_address: walletLower,
        name: session.user.user_metadata?.name ?? null,
        email: session.user.email ?? null,
        avatar: session.user.user_metadata?.avatar_url ?? null,
      };
      try {
        const { data: inserted, error: insertError } = await supabase
          .from("users")
          .insert(insertPayload)
          .select("*")
          .maybeSingle();
        if (insertError) {
          if (
            insertError.code === "23505" &&
            insertError.message?.includes("users_wallet_address_key")
          ) {
            console.warn(
              "[AUTH] insert conflict on wallet_address, fetching existing..."
            );
            const { data: existing } = await supabase
              .from("users")
              .select("*")
              .eq("wallet_address", walletLower)
              .maybeSingle();
            if (existing) setUnifiedProfile(existing, session.user);
            else setProfile(null);
          } else {
            console.error(
              "[AUTH] failed to create public.users row:",
              insertError
            );
            setProfile(null);
          }
        } else {
          setUnifiedProfile(inserted, session.user);
        }
      } catch (insertUnexpectedErr) {
        console.error(
          "[AUTH] unexpected error during insert:",
          insertUnexpectedErr
        );
        setProfile(null);
      }
    } catch (err) {
      console.error("[AUTH] handleSession unexpected:", err);
      setProfile(null);
    }
  };

  useEffect(() => {
    if (
      !isConnected ||
      !address ||
      profile?.supabaseUser ||
      signInAttemptRef.current
    )
      return;

    signInAttemptRef.current = true;

    const triggerSignIn = async () => {
      const message = `Welcome to IStory 🌌

Sign this message to log in securely.

Site: ${window.location.origin}
Page: ${window.location.pathname}

No transaction · No gas fees · Completely free

Nonce: ${Date.now()}`;
      try {
        const signature = await signMessageAsync({ message });
        await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, message, signature }),
        });
        console.log(
          "MetaMask signed → /api/auth called → session will be created"
        );
      } catch (err: any) {
        if (err.code !== "ACTION_REJECTED") {
          console.error("Sign-in error:", err);
        }
      } finally {
        setTimeout(() => (signInAttemptRef.current = false), 3000);
      }
    };

    triggerSignIn();
  }, [isConnected, address, profile?.supabaseUser, signMessageAsync]);

  return (
    <AuthContext.Provider value={profile}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
