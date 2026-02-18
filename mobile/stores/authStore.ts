// e-Story Mobile - Auth Store (Zustand)
// Replaces web AuthProvider.tsx context with Zustand store for RN

import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { supabase } from "../lib/supabase";
import { api, setAuthToken, clearAuthToken } from "../lib/api";
import type { OnboardingData } from "../types";

const TOKEN_KEY = "supabase_access_token";
const REFRESH_KEY = "supabase_refresh_token";

export interface UserProfile {
  id: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
  wallet_address: string | null;
  email: string | null;
  bio: string | null;
  badges: string[] | null;
  google_id: string | null;
  created_at: string;
}

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authMethod: "wallet" | "google" | null;

  // Actions
  initialize: () => Promise<void>;
  loginWithWallet: (address: string, signMessage: (message: string) => Promise<string>) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  authMethod: null,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await setAuthToken(session.access_token);
        await get().fetchProfile();
        set({
          isAuthenticated: true,
          authMethod: session.user?.app_metadata?.provider === "google" ? "google" : "wallet",
        });
      }
    } catch (err) {
      console.error("[Auth] Initialize failed:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  loginWithWallet: async (address, signMessage) => {
    set({ isLoading: true });
    try {
      // 1. Get nonce
      const nonceRes = await api<{ nonce: string; message: string }>(
        `/api/auth/nonce?address=${address}`
      );
      if (!nonceRes.ok || !nonceRes.data) {
        throw new Error(nonceRes.error || "Failed to get nonce");
      }

      // 2. Sign the message
      const signature = await signMessage(nonceRes.data.message);

      // 3. Login with signature
      const loginRes = await api<{
        token: string;
        session_token?: string;
        user: UserProfile;
      }>("/api/auth/login", {
        method: "POST",
        body: { address, signature, nonce: nonceRes.data.nonce },
      });

      if (!loginRes.ok || !loginRes.data) {
        throw new Error(loginRes.error || "Login failed");
      }

      // 4. Store token & set session
      await setAuthToken(loginRes.data.token);

      if (loginRes.data.session_token) {
        await supabase.auth.verifyOtp({
          token_hash: loginRes.data.session_token,
          type: "email",
        });
      }

      set({
        user: loginRes.data.user,
        isAuthenticated: true,
        authMethod: "wallet",
      });
    } catch (err) {
      console.error("[Auth] Wallet login failed:", err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  loginWithGoogle: async (idToken: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      });

      if (error) throw error;
      if (data.session) {
        await setAuthToken(data.session.access_token);
        await get().fetchProfile();
        set({ isAuthenticated: true, authMethod: "google" });
      }
    } catch (err) {
      console.error("[Auth] Google login failed:", err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await supabase.auth.signOut();
      await clearAuthToken();
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_KEY);
      set({ user: null, isAuthenticated: false, authMethod: null });
    } catch (err) {
      console.error("[Auth] Logout failed:", err);
    }
  },

  fetchProfile: async () => {
    try {
      const res = await api<{ user: UserProfile }>("/api/user/profile");
      if (res.ok && res.data) {
        set({ user: res.data.user });
      }
    } catch (err) {
      console.error("[Auth] Fetch profile failed:", err);
    }
  },

  completeOnboarding: async (data: OnboardingData) => {
    const user = get().user;
    if (!user) return;

    const res = await api("/api/auth/onboarding", {
      method: "POST",
      body: { ...data, userId: user.id },
    });

    if (res.ok) {
      set({
        user: { ...user, name: data.name, username: data.username, email: data.email },
      });
    }
  },

  updateProfile: async (updates: Partial<UserProfile>) => {
    const res = await api("/api/user/profile", {
      method: "PUT",
      body: updates as Record<string, unknown>,
    });

    if (res.ok) {
      const user = get().user;
      if (user) {
        set({ user: { ...user, ...updates } });
      }
    }
  },
}));
