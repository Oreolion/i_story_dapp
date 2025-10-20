"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useAccount, useBalance, useSignMessage } from "wagmi";  // Add useSignMessage
import { supabaseClient } from "@/app/utils/supabase/supabaseClient";
import type { User, Session } from "@supabase/supabase-js";

// A unified profile that includes both database and live wallet data
export interface UnifiedUserProfile {
  // From Supabase `users` table
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
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
  const { signMessageAsync } = useSignMessage();  // For signing

  // Fetch initial session on mount
  useEffect(() => {
    const fetchInitialSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) {
        console.error("Error fetching initial session:", error.message);
        return;
      }
      await handleSession(session);
    };

    fetchInitialSession();
  }, [supabase]); // Run once on mount

  // Listen for auth changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await handleSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isConnected, address, ethBalance, supabase]);

  // Sync wallet on address/connect change (centralized here)
  useEffect(() => {
    const syncUser = async () => {
      if (!isConnected || !address) return;
      const message = "Welcome to StoryChain";

      let signature;
      try {
        signature = await signMessageAsync({ message });
        console.log("Generated signature:", signature.substring(0, 10) + "...");
      } catch (err) {
        console.error("Signature generation failed:", err);
        return;
      }

      try {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, message, signature }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error("Sign-in failed:", errorText);
          return;
        }

        const data = await res.json();
        if (data.success) {
          console.log("Wallet signed in and user linked/created:", data.user);
          // Refresh session to update profile
          await supabase.auth.refreshSession();
        }
      } catch (err) {
        console.error("Error during wallet sign-in:", err);
      }
    };

    syncUser();
  }, [isConnected, address, signMessageAsync, supabase]);  // Trigger on connect/address change

  // Shared handler for session (initial or change)
  const handleSession = async (session: Session | null) => {
    // Force re-fetch after 1s to ensure DB sync
    setTimeout(async () => {
      if (session?.user) {
        const { data: refreshedProfile } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();
        if (refreshedProfile) {
          setProfile({
            ...refreshedProfile,
            isConnected,
            balance: ethBalance?.formatted ?? "0",
            wallet_address:
              address?.toLowerCase() ?? refreshedProfile.wallet_address,
            supabaseUser: session.user,
          });
        }
      }
    }, 1000);
    if (session?.user) {
      // Fetch profile
      let { data: userProfile, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      console.log("Fetched User Profile:", userProfile);

      if (error || !userProfile) {
        console.warn(
          "No user profile found or fetch error; creating one:",
          error?.message
        );
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
          .single();

        if (insertError) {
          console.error(
            "Error creating user profile:",
            insertError.message,
            insertError.details,
            insertError.hint
          );
          // Fallback partial profile
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

      // Set combined profile
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
      setProfile(null);
    }
  };

  // Auto-link wallet if missing
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

export const useAuth = () => {
  return useContext(AuthContext);
};