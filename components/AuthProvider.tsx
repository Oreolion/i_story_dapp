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
import { supabaseClient } from "@/app/utils/supabase/supabaseClient";

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
  const supabase = supabaseClient;
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

  // Optional: keep this for future Supabase-session based flows
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

      // Don't attempt insert if wallet_address is null (NOT NULL constraint)
      // The wallet-based flow (line 235+) will handle user creation properly
      if (!walletLower) {
        console.warn("[AUTH] No wallet_address available, skipping user creation from session");
        setProfile(null);
        return;
      }

      const insertPayload = {
        id: session.user.id,
        wallet_address: walletLower,
        name: session.user.user_metadata?.name ?? null,
        email: session.user.email ?? null,
        avatar: session.user.user_metadata?.avatar_url ?? null,
      };

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
          const { data: existing, error: fetchExistingErr } = await supabase
            .from("users")
            .select("*")
            .eq("wallet_address", walletLower)
            .maybeSingle();

          if (fetchExistingErr) {
            console.error(
              "[AUTH] failed to fetch existing by wallet_address:",
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
      } else {
        setUnifiedProfile(inserted, session.user);
      }
    } catch (err) {
      console.error("[AUTH] handleSession unexpected:", err);
      setProfile(null);
    }
  };

  // 🔴 THIS IS THE IMPORTANT PART: hydrate profile from /api/auth
//   useEffect(() => {
//     if (!isConnected || !address) return;
//     if (profile) return; // ✅ already have a profile, don't pop MetaMask again
//     if (signInAttemptRef.current) return;

//     signInAttemptRef.current = true;

//     const triggerSignIn = async () => {
//       const message = `Welcome to IStory 🌌

// Sign this message to log in securely.

// Site: ${window.location.origin}
// Page: ${window.location.pathname}
// Address: ${address}

// No transaction · No gas fees · Completely free

// Nonce: ${Date.now()}`;

//       try {
//         const signature = await signMessageAsync({ message });

//         const res = await fetch("/api/auth/login", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ address, message, signature }),
//         });

//         if (!res.ok) {
//           const errJson = await res.json().catch(() => ({}));
//           console.error("[AUTH] /api/auth failed:", errJson);
//           throw new Error(errJson.error || "Auth failed");
//         }

//         const json = await res.json();
//         const userRow = json.user;

//         if (!userRow) {
//           console.warn("[AUTH] /api/auth returned no user row");
//         } else {
//           console.log("[AUTH] /api/auth success, setting profile:", userRow);
//           // We don't have a Supabase session; pass null for supabaseUser.
//           setUnifiedProfile(userRow, null);
//         }

//         console.log(
//           "MetaMask signed → /api/auth called → profile hydrated from server"
//         );
//       } catch (err: any) {
//         if (err.code !== "ACTION_REJECTED") {
//           console.error("Sign-in error:", err);
//         }
//       } finally {
//         setTimeout(() => (signInAttemptRef.current = false), 3000);
//       }
//     };

//     triggerSignIn();
//   }, [isConnected, address, profile, signMessageAsync]);

// 🔴 HYDRATE PROFILE WITHOUT POPPING METAMASK ON EVERY RELOAD
useEffect(() => {
  if (!supabase) return;
  if (!isConnected || !address) return;
  if (signInAttemptRef.current) return;
  if (profile) return; // ✅ already hydrated in memory

  const run = async () => {
    try {
      // 1) Try to hydrate from existing public.users row by wallet_address (no signature needed)
      const { data: existing, error } = await supabase
        .from("users")
        .select("*")
        .eq("wallet_address", address.toLowerCase())
        .maybeSingle();

      if (error) {
        console.error("[AUTH] lookup by wallet_address error:", error);
      }

      if (existing) {
        console.log(
          "[AUTH] found existing user by wallet_address, no MetaMask sign-in needed"
        );
        // We don't have a Supabase session; pass null for supabaseUser.
        setUnifiedProfile(existing, null);
        return; // ✅ stop here, do NOT trigger MetaMask
      }

      // 2) No existing user → run your current MetaMask + /api/auth/login flow
      signInAttemptRef.current = true;

      const message = `Welcome to IStory 🌌

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

        if (!userRow) {
          console.warn("[AUTH] /api/auth/login returned no user row");
        } else {
          console.log(
            "[AUTH] /api/auth/login success, setting profile from server:",
            userRow
          );
          setUnifiedProfile(userRow, null);
        }

        console.log(
          "MetaMask signed → /api/auth/login called → profile hydrated from server"
        );
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


  return (
    <AuthContext.Provider value={profile}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
