"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAccount, useBalance, useSignMessage } from "wagmi";
import type { User, Session } from "@supabase/supabase-js";
import { supabaseClient } from "@/app/utils/supabase/supabaseClient";
import type { OnboardingData } from "@/app/types";

export interface UnifiedUserProfile {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  avatar: string | null;
  wallet_address: string | null;
  balance: string;
  isConnected: boolean;
  supabaseUser: User | null;
  auth_provider: "wallet" | "google" | "both";
  is_onboarded: boolean;
  google_id: string | null;
}

export interface AuthContextType {
  profile: UnifiedUserProfile | null;
  isLoading: boolean;
  needsOnboarding: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  profile: null,
  isLoading: true,
  needsOnboarding: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  completeOnboarding: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = supabaseClient;
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address });
  const { signMessageAsync } = useSignMessage();

  const [profile, setProfile] = useState<UnifiedUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const signInAttemptRef = useRef(false);

  const buildProfile = (
    userRow: any,
    sessionUser: User | null
  ): UnifiedUserProfile => ({
    id: userRow.id,
    name: userRow.name ?? null,
    username: userRow.username ?? null,
    email: userRow.email ?? null,
    avatar: userRow.avatar ?? null,
    wallet_address:
      (userRow.wallet_address ?? address ?? null)?.toLowerCase?.() ?? null,
    balance: ethBalance?.formatted ?? "0",
    isConnected: Boolean(isConnected),
    supabaseUser: sessionUser,
    auth_provider: userRow.auth_provider ?? "wallet",
    is_onboarded: userRow.is_onboarded ?? false,
    google_id: userRow.google_id ?? null,
  });

  const setUnifiedProfile = (userRow: any, sessionUser: User | null) => {
    if (!userRow) {
      setProfile(null);
      setNeedsOnboarding(false);
      return;
    }
    const p = buildProfile(userRow, sessionUser);
    setProfile(p);
    setNeedsOnboarding(!p.is_onboarded);
  };

  // Handle Google sign-in from OAuth callback
  const handleGoogleSignIn = useCallback(
    async (session: Session) => {
      if (!supabase) return;
      const user = session.user;

      try {
        // 1. Look up by Supabase auth user id
        const { data: existing } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (existing) {
          setUnifiedProfile(existing, user);
          return;
        }

        // 2. Check by email for potential linking with existing wallet user
        const userEmail = user.email;
        if (userEmail) {
          const { data: emailMatch } = await supabase
            .from("users")
            .select("*")
            .eq("email", userEmail)
            .maybeSingle();

          if (emailMatch) {
            // Link Google to existing wallet account via server endpoint
            // (client-side update fails with 406 because RLS blocks
            //  updating another user's row — the Google OAuth session
            //  has a different auth.uid() than the wallet user's id)
            const googleId =
              user.identities?.[0]?.id ?? user.id;
            try {
              const res = await fetch("/api/auth/link-google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  existingUserId: emailMatch.id,
                  googleId,
                  googleEmail: user.email,
                  googleAvatar: user.user_metadata?.avatar_url,
                  googleName: user.user_metadata?.full_name ?? user.user_metadata?.name,
                }),
              });
              if (res.ok) {
                const { user: updated } = await res.json();
                if (updated) {
                  setUnifiedProfile(updated, user);
                  return;
                }
              } else {
                const errData = await res.json().catch(() => ({}));
                console.error("[AUTH] link-google failed:", errData);
              }
            } catch (linkErr) {
              console.error("[AUTH] link-google request error:", linkErr);
            }
          }
        }

        // 3. Create new Google-only user (auto-onboarded)
        const googleId = user.identities?.[0]?.id ?? user.id;
        const { data: created, error: createErr } = await supabase
          .from("users")
          .upsert(
            {
              id: user.id,
              name:
                user.user_metadata?.full_name ??
                user.user_metadata?.name ??
                null,
              email: user.email ?? null,
              avatar: user.user_metadata?.avatar_url ?? null,
              google_id: googleId,
              auth_provider: "google",
              is_onboarded: true,
              wallet_address: null,
            },
            { onConflict: "id", ignoreDuplicates: true }
          )
          .select()
          .maybeSingle();

        if (createErr) {
          console.error("[AUTH] Google user creation failed:", createErr);
          setProfile(null);
          return;
        }

        if (created) {
          setUnifiedProfile(created, user);
        } else {
          // User already existed (ignoreDuplicates) — fetch existing
          const { data: existing } = await supabase
            .from("users")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();
          if (existing) {
            setUnifiedProfile(existing, user);
          } else {
            setProfile(null);
          }
        }
      } catch (err) {
        console.error("[AUTH] handleGoogleSignIn error:", err);
        setProfile(null);
      }
    },
    [supabase, address, isConnected, ethBalance]
  );

  // Effect: Session hydration on mount
  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
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
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  // Effect: Auth state change listener
  useEffect(() => {
    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        const provider = session.user.app_metadata?.provider;
        if (provider === "google") {
          await handleGoogleSignIn(session);
          return;
        }
      }
      if (event === "SIGNED_OUT") {
        // Only clear profile if no wallet connected
        if (!isConnected) {
          setProfile(null);
          setNeedsOnboarding(false);
        }
        return;
      }
      if (session) {
        await handleSession(session);
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase, isConnected, handleGoogleSignIn]);

  const handleSession = async (session: Session | null) => {
    if (!supabase) return;
    if (!session?.user) {
      setProfile(null);
      setNeedsOnboarding(false);
      return;
    }

    const sessionWalletAddress =
      (session.user.user_metadata?.wallet_address as string | undefined) ||
      (address ?? null);
    const walletLower = sessionWalletAddress?.toLowerCase?.() ?? null;

    try {
      // Look up by auth id OR wallet_address (user may have a new session id
      // but the same wallet already exists from a previous session)
      const lookupFilter = walletLower
        ? `id.eq.${session.user.id},wallet_address.eq.${walletLower}`
        : `id.eq.${session.user.id}`;

      const { data: userProfile, error } = await supabase
        .from("users")
        .select("*")
        .or(lookupFilter)
        .maybeSingle();

      if (error) console.error("[AUTH] fetch profile error:", error);

      if (userProfile) {
        setUnifiedProfile(userProfile, session.user);
        return;
      }

      // Don't attempt insert if wallet_address is null
      if (!walletLower) {
        console.warn(
          "[AUTH] No wallet_address available, skipping user creation from session"
        );
        setProfile(null);
        return;
      }

      const insertPayload = {
        id: session.user.id,
        wallet_address: walletLower,
        name:
          session.user.user_metadata?.name ?? null,
        email: session.user.email ?? null,
        avatar: session.user.user_metadata?.avatar_url ?? null,
        auth_provider: "wallet" as const,
        is_onboarded: false,
      };

      const { data: inserted, error: insertError } = await supabase
        .from("users")
        .insert(insertPayload)
        .select("*")
        .maybeSingle();

      if (insertError) {
        if (insertError.code === "23505") {
          // Race condition: row was created between our lookup and insert
          const { data: existing, error: fetchExistingErr } = await supabase
            .from("users")
            .select("*")
            .or(`id.eq.${session.user.id},wallet_address.eq.${walletLower}`)
            .maybeSingle();

          if (fetchExistingErr) {
            console.error(
              "[AUTH] failed to fetch existing user:",
              fetchExistingErr
            );
            setProfile(null);
          } else if (existing) {
            setUnifiedProfile(existing, session.user);
          } else {
            setProfile(null);
          }
        } else {
          console.error(
            "[AUTH] failed to create public.users row:",
            insertError
          );
          setProfile(null);
        }
      } else if (inserted) {
        setUnifiedProfile(inserted, session.user);
      } else {
        // upsert with ignoreDuplicates returns null for existing rows — fetch it
        const { data: existing } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();
        if (existing) {
          setUnifiedProfile(existing, session.user);
        } else {
          setProfile(null);
        }
      }
    } catch (err) {
      console.error("[AUTH] handleSession unexpected:", err);
      setProfile(null);
    }
  };

  // Wallet connection effect — hydrate without MetaMask popup for returning users
  useEffect(() => {
    if (!supabase) return;
    if (!isConnected || !address) return;
    if (signInAttemptRef.current) return;
    if (profile) return;

    const run = async () => {
      try {
        const { data: existing, error } = await supabase
          .from("users")
          .select("*")
          .eq("wallet_address", address.toLowerCase())
          .maybeSingle();

        if (error) {
          console.error("[AUTH] lookup by wallet_address error:", error);
        }

        if (existing) {
          setUnifiedProfile(existing, null);
          return;
        }

        // No existing user → MetaMask signature flow
        signInAttemptRef.current = true;

        const message = `Welcome to IStory

Sign this message to log in securely.

Site: ${window.location.origin}
Page: ${window.location.pathname}
Address: ${address}

No transaction · No gas fees · Completely free

Nonce: ${Date.now()}`;

        try {
          const signature = await signMessageAsync({ message });

          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address, message, signature }),
          });

          if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            console.error("[AUTH] /api/auth/login failed:", errJson);
            throw new Error(errJson.error || "Auth failed");
          }

          const json = await res.json();
          const userRow = json.user;

          if (userRow) {
            setUnifiedProfile(userRow, null);
          }
        } catch (err: any) {
          if (err.code !== "ACTION_REJECTED") {
            console.error("Sign-in error:", err);
          }
        } finally {
          setTimeout(() => {
            signInAttemptRef.current = false;
          }, 3000);
        }
      } catch (err) {
        console.error("[AUTH] unexpected error in wallet login flow:", err);
      }
    };

    run();
  }, [supabase, isConnected, address, profile, signMessageAsync]);

  // Public API functions
  const signInWithGoogle = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  }, [supabase]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setProfile(null);
    setNeedsOnboarding(false);
  }, [supabase]);

  const completeOnboarding = useCallback(
    async (data: OnboardingData) => {
      if (!profile) throw new Error("No profile to onboard");

      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.id, ...data }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Onboarding failed");
      }

      const { user } = await res.json();
      setUnifiedProfile(user, profile.supabaseUser);
    },
    [profile, address, isConnected, ethBalance]
  );

  const refreshProfile = useCallback(async () => {
    if (!supabase || !profile) return;
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", profile.id)
      .maybeSingle();
    if (data) {
      setUnifiedProfile(data, profile.supabaseUser);
    }
  }, [supabase, profile, address, isConnected, ethBalance]);

  const contextValue: AuthContextType = {
    profile,
    isLoading,
    needsOnboarding,
    signInWithGoogle,
    signOut,
    completeOnboarding,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
