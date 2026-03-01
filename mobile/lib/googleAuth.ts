// Google Auth via expo-auth-session + Supabase signInWithIdToken
// Authenticates directly with Google (no Supabase hosted page), then
// exchanges the Google ID token for a Supabase session.
//
// Uses the Web Client ID (same one configured in Supabase) because
// expo-auth-session is browser-based, not a native Google SDK.
// This way the ID token's `aud` matches Supabase's configured client ID.

import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as Crypto from "expo-crypto";
import Constants from "expo-constants";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

// Try multiple sources for the Google Web Client ID
function getGoogleWebClientId(): string {
  // 1. app.config.ts extra (standard Expo pattern)
  const fromExtra = Constants.expoConfig?.extra?.GOOGLE_WEB_CLIENT_ID;
  if (fromExtra) return fromExtra;

  // 2. EXPO_PUBLIC_ env var (Expo SDK 49+ inline env vars)
  const fromEnv = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (fromEnv) return fromEnv;

  // 3. Legacy names from previous config
  const fromIos = Constants.expoConfig?.extra?.GOOGLE_CLIENT_ID_IOS;
  if (fromIos) return fromIos;
  const fromAndroid = Constants.expoConfig?.extra?.GOOGLE_CLIENT_ID_ANDROID;
  if (fromAndroid) return fromAndroid;

  return "";
}

const GOOGLE_WEB_CLIENT_ID = getGoogleWebClientId();

// Google OAuth discovery document
const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

/**
 * Launches Google sign-in directly (no Supabase hosted page).
 * Returns Supabase session tokens or null if user cancelled.
 */
export async function signInWithGoogleNative(): Promise<{
  accessToken: string;
  refreshToken: string;
  needsOnboarding: boolean;
} | null> {
  if (!GOOGLE_WEB_CLIENT_ID) {
    // Debug: log what's actually available so we can diagnose
    console.error(
      "[GoogleAuth] No client ID found. Available extra keys:",
      Object.keys(Constants.expoConfig?.extra || {}),
      "Extra values (redacted):",
      Object.fromEntries(
        Object.entries(Constants.expoConfig?.extra || {}).map(([k, v]) => [
          k,
          typeof v === "string" && v.length > 0 ? `${v.substring(0, 8)}...` : "(empty)",
        ])
      )
    );
    throw new Error(
      "GOOGLE_WEB_CLIENT_ID not configured. Add it to mobile/.env and restart expo (npx expo start --clear)"
    );
  }

  const redirectUri = AuthSession.makeRedirectUri();
  console.log("[GoogleAuth] Redirect URI:", redirectUri);

  // Create a random nonce.
  // Supabase hashes the raw nonce (SHA-256) and compares it to the nonce
  // embedded in the ID token. So we send the HASHED nonce to Google
  // (embedded in the token) and the RAW nonce to Supabase (it hashes it).
  const rawNonce = Crypto.getRandomBytes(16)
    .reduce((acc, byte) => acc + byte.toString(16).padStart(2, "0"), "");

  const hashedNonceBytes = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce
  );

  // Request ID token directly from Google (implicit flow — no PKCE)
  const request = new AuthSession.AuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    redirectUri,
    scopes: ["openid", "profile", "email"],
    responseType: AuthSession.ResponseType.IdToken,
    usePKCE: false,
    extraParams: {
      nonce: hashedNonceBytes,
    },
  });

  const result = await request.promptAsync(discovery);

  if (result.type !== "success") {
    // User cancelled or dismissed
    return null;
  }

  const idToken = result.params.id_token;
  if (!idToken) {
    throw new Error("No ID token returned from Google");
  }

  // Exchange Google ID token for Supabase session.
  // Pass the RAW nonce — Supabase will SHA-256 hash it and compare
  // against the hashed nonce embedded in the ID token by Google.
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
    nonce: rawNonce,
  });

  if (error) throw error;
  if (!data.session) throw new Error("No session returned from Supabase");

  // Check if user needs onboarding
  const user = data.session.user;
  const needsOnboarding = !user?.user_metadata?.name && !user?.user_metadata?.full_name;

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    needsOnboarding,
  };
}
