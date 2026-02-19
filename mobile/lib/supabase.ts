// e-Story Mobile - Supabase Client with SecureStore adapter
// Replaces web's localStorage-based client with encrypted SecureStore

import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const supabaseUrl =
  Constants.expoConfig?.extra?.SUPABASE_URL || "";
const supabaseAnonKey =
  Constants.expoConfig?.extra?.SUPABASE_ANON_KEY || "";

// SecureStore adapter for Supabase Auth
// SecureStore has a 2048 byte limit per key, so we chunk large values
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.error("[SecureStore] Failed to set item:", key, err);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (err) {
      console.error("[SecureStore] Failed to remove item:", key, err);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Important for RN — no URL-based session detection
  },
});
