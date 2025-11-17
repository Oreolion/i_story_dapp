// components/AuthProvider.tsx
"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAccount, useBalance } from "wagmi";
import type { User, Session } from "@supabase/supabase-js";
import { useBrowserSupabase } from "@/app/hooks/useBrowserSupabase"; // <-- your singleton client import

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
  // NOTE: this assumes useBrowserSupabase exports the client (not a hook).
  // Keep usage identical to your code (singleton).
  const supabase = useBrowserSupabase();
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address });

  const [profile, setProfile] = useState<UnifiedUserProfile | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const signInAttemptRef = useRef(false); // prevents sign-in loops

  // -------------------------
  // helper: set unified profile object
  // -------------------------
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

  // -------------------------
  // 1) load initial session once on mount
  // -------------------------
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
      console.log(
        "[ENV]",
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          ? "anon-key-present"
          : "no-key"
      );
      const { data } = await supabase.auth.getSession();
      console.log(
        "[AUTH] getSession result:",
        data?.session ? "HAS_SESSION" : "NO_SESSION"
      );
    })();

    return () => {
      mounted = false;
    };
    // intentionally run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  // -------------------------
  // 2) subscribe for auth changes (handles sign-in completion)
  // -------------------------
  useEffect(() => {
    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // handle session or null
      handleSession(session || null).catch((e) =>
        console.error("[AUTH] onAuthStateChange handler error:", e)
      );
    });
    return () => subscription.unsubscribe();
  }, [supabase]); // re-subscribe if supabase instance changes

  // -------------------------
  // 3) handleSession: fetch/create profile and handle duplicates safely
  // -------------------------
  const handleSession = async (session: Session | null) => {
    if (!supabase) return;
    if (!session?.user) {
      // no authenticated user
      setProfile(null);
      return;
    }

    // prefer wallet_address from session metadata, then external address
    const sessionWalletAddress =
      (session.user.user_metadata?.wallet_address as string | undefined) ||
      (address ?? null);
    const walletLower = sessionWalletAddress?.toLowerCase?.() ?? null;

    try {
      // 3.a Try to read public.users by auth.users.id
      const { data: userProfile, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("[AUTH] fetch profile by id error:", error);
        // we continue to attempt insert/fallback below rather than bail out
      }

      if (userProfile) {
        setUnifiedProfile(userProfile, session.user);
        return;
      }

      // 3.b Not found: attempt to create a matching public.users row
      // This will create public.users.id === auth.users.id for new users.
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
          // check for duplicate key on wallet_address (unique constraint)
          // Supabase error shape: insertError.code (e.g., '23505') and message.
          if (
            insertError.code === "23505" &&
            insertError.message?.includes("users_wallet_address_key")
          ) {
            console.warn(
              "[AUTH] insert conflict on wallet_address, fetching existing row..."
            );
            // Fallback: fetch existing by wallet_address and use it as canonical profile.
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
              // fallback to null profile (do not throw)
              setProfile(null);
            } else if (existing) {
              // Use existing profile as canonical for client session.
              // Note: auth.users.id != public.users.id in this scenario.
              setUnifiedProfile(existing, session.user);

              // OPTIONAL: inform server/admin to merge later (server-only, service role)
              // await fetch("/api/merge-user", { method: "POST", body: JSON.stringify({ new_user_id: session.user.id, wallet_address: walletLower }) });
            } else {
              // no existing found (unexpected) -> clear profile
              setProfile(null);
            }
          } else {
            // other insert error
            console.error(
              "[AUTH] failed to create public.users row:",
              insertError
            );
            setProfile(null);
          }
        } else {
          // Insert succeeded — great, we have public.users.id === auth.users.id
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

  // -------------------------
  // 4) sync wallet -> supabase: only attempt sign-in once after initial session check
  // -------------------------
  useEffect(() => {
    if (!supabase) return;
    if (isSessionLoading) return;
    if (profile) return;
    if (!isConnected || !address) return;
    if (signInAttemptRef.current) return;

    signInAttemptRef.current = true;
    (async () => {
      try {
        // --- NEW: confirm there is no valid session before prompting wallet
        try {
          const { data } = await supabase.auth.getSession();
          const existingSession = data?.session ?? null;
          if (existingSession) {
            console.log(
              "[AUTH] session already exists — skipping signInWithWeb3"
            );
            return;
          }
        } catch (sErr) {
          console.warn(
            "[AUTH] getSession check failed (continuing to signIn):",
            sErr
          );
          // proceed (rare)
        }

        console.log("[AUTH] Triggering signInWithWeb3...");
        const { error } = await supabase.auth.signInWithWeb3({
          chain: "ethereum",
          statement: "Sign to authenticate to IStory.",
        });

        if (error) {
          console.error("[AUTH] signInWithWeb3 error:", error);
        } else {
          console.log("[AUTH] signInWithWeb3 started; waiting for session...");
        }
      } catch (err: any) {
        console.error("[AUTH] signInWithWeb3 failed:", err?.message ?? err);
      } finally {
        setTimeout(() => (signInAttemptRef.current = false), 2000);
      }
    })();
  }, [isSessionLoading, profile, isConnected, address, supabase]);

  return (
    <AuthContext.Provider value={profile}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
