"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { useAccount, useBalance } from "wagmi";
import { supabaseClient } from "../app/utils/supabase/supabaseClient";
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
  
  // This state is the key to fixing the "sign on reload" bug
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address });

  // We wrap handleSession in useCallback so it's a stable dependency
  const handleSession = useCallback(
    async (session: Session | null) => {
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
            name:
              session.user.user_metadata?.name ||
              session.user.user_metadata?.full_name ||
              "Anonymous User",
            email: session.user.email ?? null,
            avatar:
              session.user.user_metadata?.avatar_url ||
              session.user.user_metadata?.picture ||
              null,
            wallet_address: address?.toLowerCase() ?? null,
          };
          const { data: newProfile, error: insertError } = await supabase
            .from("users")
            .insert(insertData)
            .select("*")
            .maybeSingle();

          if (insertError) {
            // Your smart merge logic is preserved
            if (
              insertError.code === "23505" &&
              insertError.message.includes("users_wallet_address_key")
            ) {
              console.log("Duplicate wallet_address; attempting merge.");
              try {
                const res = await fetch("/api/merge-user", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    new_user_id: session.user.id,
                    wallet_address: address?.toLowerCase(),
                  }),
                });
                if (!res.ok) throw new Error(await res.text());
                console.log("Merge successful; refreshing profile.");
                const { data: mergedProfile, error: mergeFetchError } =
                  await supabase
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
                    wallet_address:
                      address?.toLowerCase() ?? mergedProfile.wallet_address,
                    supabaseUser: session.user,
                  });
                  setIsSessionLoading(false); // Mark loading as done
                  return;
                }
              } catch (mergeErr) {
                console.error("Merge failed:", mergeErr);
              }
            }
            // Fallback for other errors
            console.error(
              "Error creating user profile:",
              insertError.message
            );
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
          } else {
            userProfile = newProfile; // Use the newly created profile
          }
        }
        
        // Standard profile set
        if (userProfile) { // Check if userProfile is not null before setting
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
        }

      } else {
        // No session, check for public profile
        if (isConnected && address) {
          const { data: userProfile, error } = await supabase
            .from("users")
            .select("*")
            .eq("wallet_address", address.toLowerCase())
            .maybeSingle();
          if (error) {
            console.error("Error fetching profile by wallet_address:", error.message);
            setProfile(null);
          } else if (userProfile) {
            console.log("Fetched User Profile by wallet_address:", userProfile);
            setProfile({
              ...userProfile,
              isConnected,
              balance: ethBalance?.formatted ?? "0",
              wallet_address: address.toLowerCase(),
              supabaseUser: null,
            });
          } else {
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      }
      // CRITICAL: We are now done loading the session/profile
      setIsSessionLoading(false);
    },
    [supabase, address, isConnected, ethBalance] // Dependencies
  );

  // This single listener replaces both fetchInitialSession and onAuthStateChange
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`Supabase auth event: ${event}`);
      await handleSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, handleSession]); // Re-subscribes if handleSession changes

  // This hook handles the auto-sign-in logic
  useEffect(() => {
    const syncUser = async () => {
      // This is the FIX for the "sign on reload" bug:
      // 1. Wait for the session to be checked (isSessionLoading is false)
      // 2. Only run if we are NOT logged in (profile is null)
      // 3. Only run if the wallet is connected (isConnected and address exist)
      if (isSessionLoading || profile || !isConnected || !address) {
        return;
      }

      // If we get here, it means:
      // - Session check is finished.
      // - Profile is null.
      // - Wallet is connected.
      // This is the *only* time we should ask the user to sign.
      console.log("No session found. Starting sign-in flow...");

      // This is the OFFICIAL Supabase method.
      try {
        const { error: web3Error } = await supabase.auth.signInWithWeb3({
          chain: 'ethereum',
          statement: 'Welcome to IStory - AI-Powered Blockchain Journaling DApp. Sign this message to authenticate.',
        });

        if (web3Error) throw web3Error;
        
        // Success! The onAuthStateChange listener will now
        // automatically pick up the new session and run handleSession.
        console.log("Sign-in successful. Waiting for auth state change...");
      } catch (err: any) {
        // This will now correctly log the "URI not allowed" error
        // until you fix the Supabase dashboard settings.
        console.error("Sign-in failed during syncUser:", err.message);
      }
    };

    syncUser();
  }, [isSessionLoading, profile, isConnected, address, supabase]);

  // This auto-links the wallet if a profile is missing it
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

