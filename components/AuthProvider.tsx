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

const WALLET_TOKEN_KEY = "estory_wallet_token";

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
  /** Get a valid Bearer token for API calls (Supabase or wallet JWT). */
  getAccessToken: () => Promise<string | null>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  profile: null,
  isLoading: true,
  needsOnboarding: false,
  getAccessToken: async () => null,
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

  // ─── Centralized token accessor ──────────────────────────────────────
  // All pages/components use this instead of their own getAuthHeaders().
  // Priority: 1) stored wallet JWT → 2) Supabase session (Google/OAuth)
  //
  // Wallet JWT takes priority because supabase.auth.getSession() can return
  // a stale/expired cached session, which shadows a valid wallet JWT and
  // causes 401s. Wallet JWTs are explicitly issued for API auth and are
  // more reliable.
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    // 1. Try stored wallet JWT (wallet-authenticated users)
    if (typeof window !== "undefined") {
      const walletToken = localStorage.getItem(WALLET_TOKEN_KEY);
      if (walletToken) {
        // Quick expiry check — decode JWT payload without verification
        try {
          const base64 = walletToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
          const payload = JSON.parse(atob(base64));
          if (payload.exp && payload.exp * 1000 > Date.now() + 30_000) {
            return walletToken;
          }
          // Expired — clear stale token so user can re-authenticate
          localStorage.removeItem(WALLET_TOKEN_KEY);
        } catch {
          // Malformed JWT — clear it
          localStorage.removeItem(WALLET_TOKEN_KEY);
        }
      }
    }

    // 2. Try Supabase session (Google OAuth users)
    try {
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        const session = data?.session;
        if (session?.access_token) {
          // Verify session isn't expired (with 60s buffer)
          if (session.expires_at && session.expires_at * 1000 > Date.now() + 60_000) {
            return session.access_token;
          }
          // Session expired — attempt refresh
          const { data: refreshed } = await supabase.auth.refreshSession();
          if (refreshed?.session?.access_token) {
            return refreshed.session.access_token;
          }
        }
      }
    } catch {
      // Supabase session unavailable
    }

    return null;
  }, [supabase]);

  // ─── Google OAuth handler ────────────────────────────────────────────
  const handleGoogleSignIn = useCallback(
    async (session: Session) => {
      if (!supabase) return;
      const user = session.user;
      const googleId = user.identities?.[0]?.id ?? user.id;

      try {
        // PRIORITY 1: Check for secure linking token (wallet user initiated "Link Google")
        const linkingToken =
          typeof window !== "undefined"
            ? sessionStorage.getItem("googleLinkingToken")
            : null;
        const linkingUserId =
          typeof window !== "undefined"
            ? sessionStorage.getItem("googleLinkingUserId")
            : null;

        if (linkingToken && linkingUserId) {
          sessionStorage.removeItem("googleLinkingToken");
          sessionStorage.removeItem("googleLinkingUserId");

          try {
            const res = await fetch("/api/auth/link-google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                existingUserId: linkingUserId,
                googleId,
                googleEmail: user.email,
                googleAvatar: user.user_metadata?.avatar_url,
                googleName:
                  user.user_metadata?.full_name ?? user.user_metadata?.name,
                linkingToken,
              }),
            });

            if (res.ok) {
              const { user: updated } = await res.json();
              if (updated) {
                console.log(
                  "[AUTH] Google linked successfully via secure token"
                );
                setUnifiedProfile(updated, user);
                return;
              }
            } else {
              const errData = await res.json().catch(() => ({}));
              console.error("[AUTH] Secure link-google failed:", errData);
            }
          } catch (linkErr) {
            console.error("[AUTH] Secure link-google request error:", linkErr);
          }
        }

        // PRIORITY 2: Look up by Supabase auth user id (returning Google user)
        const { data: existing } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (existing) {
          setUnifiedProfile(existing, user);
          return;
        }

        // PRIORITY 3: Look up by google_id (account was merged, ID differs)
        const { data: byGoogleId } = await supabase
          .from("users")
          .select("*")
          .eq("google_id", googleId)
          .maybeSingle();

        if (byGoogleId) {
          setUnifiedProfile(byGoogleId, user);
          return;
        }

        // PRIORITY 4: Check by email for potential auto-linking (same email)
        const userEmail = user.email;
        if (userEmail) {
          const { data: emailMatch } = await supabase
            .from("users")
            .select("*")
            .eq("email", userEmail)
            .maybeSingle();

          if (emailMatch && !emailMatch.google_id) {
            console.log(
              "[AUTH] Auto-linking by email match (same email proves ownership)"
            );
            const { data: updated, error: updateErr } = await supabase
              .from("users")
              .update({
                google_id: googleId,
                auth_provider: emailMatch.wallet_address ? "both" : "google",
                avatar:
                  emailMatch.avatar ||
                  user.user_metadata?.avatar_url ||
                  null,
              })
              .eq("id", emailMatch.id)
              .select()
              .single();

            if (!updateErr && updated) {
              setUnifiedProfile(updated, user);
              return;
            }
          }
        }

        // PRIORITY 5: Create new Google-only user (fresh Google sign-up)
        // Set is_onboarded: false so they go through OnboardingModal to pick a username
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
              is_onboarded: false,
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
          const { data: existingFetch } = await supabase
            .from("users")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();
          if (existingFetch) {
            setUnifiedProfile(existingFetch, user);
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

  // ─── Session hydration on mount ──────────────────────────────────────
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

  // ─── Auth state change listener ──────────────────────────────────────
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

  // ─── Supabase session handler (Google/OAuth) ─────────────────────────
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
      let userProfile = null;

      // Step 1: Try lookup by Supabase auth id
      const { data: byId, error: idErr } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (idErr)
        console.error("[AUTH] fetch profile by id error:", idErr);

      if (byId) {
        userProfile = byId;
      } else if (walletLower) {
        // Step 2: If not found by id, try by wallet_address
        const { data: byWallet, error: walletErr } = await supabase
          .from("users")
          .select("*")
          .eq("wallet_address", walletLower)
          .maybeSingle();

        if (walletErr)
          console.error("[AUTH] fetch profile by wallet error:", walletErr);
        if (byWallet) userProfile = byWallet;
      }

      // Step 3: Google session, try by google_id
      if (!userProfile && session.user.app_metadata?.provider === "google") {
        const googleId =
          session.user.identities?.[0]?.id ?? session.user.id;
        const { data: byGoogleId, error: googleErr } = await supabase
          .from("users")
          .select("*")
          .eq("google_id", googleId)
          .maybeSingle();

        if (googleErr)
          console.error("[AUTH] fetch profile by google_id error:", googleErr);
        if (byGoogleId) userProfile = byGoogleId;
      }

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
        name: session.user.user_metadata?.name ?? null,
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
          let existing = null;
          const { data: byIdRetry } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle();
          if (byIdRetry) {
            existing = byIdRetry;
          } else if (walletLower) {
            const { data: byWallet } = await supabase
              .from("users")
              .select("*")
              .eq("wallet_address", walletLower)
              .maybeSingle();
            existing = byWallet;
          }
          if (existing) {
            setUnifiedProfile(existing, session.user);
          } else {
            console.error(
              "[AUTH] 23505 conflict but couldn't find existing user"
            );
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

  // ─── Wallet connection effect ────────────────────────────────────────
  // For returning users with a stored wallet JWT, hydrate profile immediately.
  // For new users (or expired JWT), trigger the signature flow.
  // IMPORTANT: Never trigger the MetaMask signature flow when a Google
  // session exists — the user should use the explicit "Link Wallet" button.
  useEffect(() => {
    if (!isConnected || !address) return;
    if (signInAttemptRef.current) return;
    if (profile) return;
    // Wait for session hydration to finish before triggering wallet login.
    // Otherwise, we race against the Google OAuth session hydration and
    // may start a nonce flow that the user didn't intend.
    if (isLoading) return;

    const run = async () => {
      try {
        const addrLower = address?.toLowerCase?.();
        if (!addrLower) {
          console.warn("[AUTH] Wallet address is undefined, skipping");
          return;
        }

        // ── Step 0: Check if there's an active Supabase session (Google user).
        // If so, the Google handler will set the profile — do NOT start
        // the MetaMask nonce→sign flow.  The user should use the
        // explicit "Link Wallet" button on the profile page instead.
        if (supabase) {
          const {
            data: { session: existingSession },
          } = await supabase.auth.getSession();

          if (existingSession?.user) {
            console.log(
              "[AUTH] Active Supabase session detected — skipping wallet auto-login. Use 'Link Wallet' to connect."
            );
            // Try to load the profile for this Google session user so the
            // UI doesn't stay in a loading/null state.
            const { data: sessionUser } = await supabase
              .from("users")
              .select("*")
              .eq("id", existingSession.user.id)
              .maybeSingle();

            if (sessionUser) {
              setUnifiedProfile(sessionUser, existingSession.user);
            }
            return;
          }
        }

        // ── Step 1: Check for stored wallet JWT (returning wallet user)
        const storedToken =
          typeof window !== "undefined"
            ? localStorage.getItem(WALLET_TOKEN_KEY)
            : null;

        if (storedToken && supabase) {
          // Validate that the user still exists
          const { data: existing } = await supabase
            .from("users")
            .select("*")
            .eq("wallet_address", addrLower)
            .maybeSingle();

          if (existing) {
            setUnifiedProfile(existing, null);
            return;
          }
          // Token exists but user not found — clear stale token
          localStorage.removeItem(WALLET_TOKEN_KEY);
        }

        // ── Step 2: Check if there's a user row matching this wallet
        if (supabase) {
          const { data: existing } = await supabase
            .from("users")
            .select("*")
            .eq("wallet_address", addrLower)
            .maybeSingle();

          if (existing) {
            setUnifiedProfile(existing, null);
            return;
          }
        }

        // ── Step 3: No stored token, no session, no existing user → MetaMask signature flow
        signInAttemptRef.current = true;

        try {
          const nonceRes = await fetch(
            `/api/auth/nonce?address=${encodeURIComponent(addrLower)}`
          );
          if (!nonceRes.ok) {
            throw new Error("Failed to get nonce");
          }
          const { message } = await nonceRes.json();

          const signature = await signMessageAsync({ message });

          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: addrLower, message, signature }),
          });

          if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            console.error("[AUTH] /api/auth/login failed:", errJson);
            throw new Error(errJson.error || "Auth failed");
          }

          const json = await res.json();
          const userRow = json.user;

          // Store the wallet JWT for API calls
          if (json.wallet_token) {
            localStorage.setItem(WALLET_TOKEN_KEY, json.wallet_token);
          }

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
  }, [supabase, isConnected, address, profile, isLoading, signMessageAsync]);

  // ─── Public API ──────────────────────────────────────────────────────
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
    // Clear wallet JWT too
    if (typeof window !== "undefined") {
      localStorage.removeItem(WALLET_TOKEN_KEY);
    }
    // Clear vault DEKs from memory (safe to call even if no vault exists)
    try {
      const { clearAllKeys } = await import("@/lib/vault");
      clearAllKeys();
    } catch {
      // Vault module may not be loaded — ignore
    }
    setProfile(null);
    setNeedsOnboarding(false);
  }, [supabase]);

  const completeOnboarding = useCallback(
    async (data: OnboardingData) => {
      if (!profile) throw new Error("No profile to onboard");

      const token = await getAccessToken();
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId: profile.id, ...data }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Onboarding failed");
      }

      const { user } = await res.json();
      setUnifiedProfile(user, profile.supabaseUser);
    },
    [profile, address, isConnected, ethBalance, getAccessToken]
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
    getAccessToken,
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
