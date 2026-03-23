// eStories Mobile - Supabase Client
// Uses cross-platform StorageAdapter (SecureStore on native, sessionStorage on web)

import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import { StorageAdapter } from "./storage";

const supabaseUrl =
  Constants.expoConfig?.extra?.SUPABASE_URL || "";
const supabaseAnonKey =
  Constants.expoConfig?.extra?.SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: StorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Important for RN — no URL-based session detection
  },
});
