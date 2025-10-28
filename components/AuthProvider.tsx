"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useAccount, useBalance } from "wagmi";  // Removed useSignMessage (no longer needed)
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
  const [isSigningIn, setIsSigningIn] = useState(false);
  // Get live wallet data from Wagmi
  const { address, isConnected, chainId } = useAccount();  // Added chainId to deps for connector readiness
  const { data: ethBalance } = useBalance({ address });
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
  // Sync wallet on connect/address change (now uses built-in Supabase Web3 auth)
  useEffect(() => {
    const syncUser = async () => {
      // Check if session already exists before signing
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log("Session already exists, skipping sign-in.");
        return;
      }
      if (!isConnected || !address || chainId === undefined) {
        console.log("Wallet not fully connected or chainId not ready, skipping.");
        return;
      }
      setIsSigningIn(true);
      try {
        const { data, error } = await supabase.auth.signInWithWeb3({
          chain: 'ethereum',
          statement: 'Welcome to IStory - AI-Powered Blockchain Journaling DApp. Sign this message to authenticate.',
        });
        if (error) throw error;
        console.log("Web3 sign-in successful:", data);
        // Session is automatically set and persisted by Supabase
      } catch (err) {
        console.error("Web3 sign-in failed:", err);
      } finally {
        setIsSigningIn(false);
      }
    };
    syncUser();
  }, [isConnected, address, chainId, supabase]);  // Added chainId to deps (re-runs when connector fully ready)
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
        .maybeSingle();
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
          .maybeSingle();
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
      if (isSigningIn) {
        console.log("Sign-in in progress; skipping fallback fetch.");
        return;
      }
      // No session: Fall back to direct DB fetch by wallet_address if connected
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
            supabaseUser: null, // No session
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