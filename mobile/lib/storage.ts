// Cross-platform secure storage adapter
// - Native (iOS/Android): expo-secure-store (Keychain / EncryptedSharedPreferences)
// - Web: In-memory with sessionStorage fallback (clears on tab close, not persistent
//   like localStorage). Web is for development only — production runs on native.
//
// Security notes:
// - SecureStore encrypts data at rest on native devices
// - sessionStorage is scoped to the tab and cleared on close (mitigates XSS persistence)
// - We never fall back to localStorage to avoid tokens persisting across sessions
// - All storage operations are wrapped in try-catch to prevent crashes

import { Platform } from "react-native";

// Only import SecureStore on native — it doesn't support web
const SecureStore =
  Platform.OS !== "web" ? require("expo-secure-store") : null;

// In-memory fallback for web (most secure — no disk persistence)
const memoryStore = new Map<string, string>();

function webGetItem(key: string): string | null {
  // Try sessionStorage first (survives page refresh within same tab),
  // fall back to memory (lost on refresh but zero disk footprint)
  try {
    const value = sessionStorage.getItem(key);
    if (value !== null) return value;
  } catch {
    // sessionStorage may be unavailable (e.g., private browsing in some browsers)
  }
  return memoryStore.get(key) ?? null;
}

function webSetItem(key: string, value: string): void {
  memoryStore.set(key, value);
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // sessionStorage unavailable or full — memory-only is fine
  }
}

function webRemoveItem(key: string): void {
  memoryStore.delete(key);
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

export async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return webGetItem(key);
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    webSetItem(key, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (err) {
    console.error("[Storage] Failed to set item:", key, err);
  }
}

export async function removeItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    webRemoveItem(key);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (err) {
    console.error("[Storage] Failed to remove item:", key, err);
  }
}

// Supabase-compatible storage adapter (matches the interface Supabase expects)
export const StorageAdapter = {
  getItem,
  setItem,
  removeItem,
};
