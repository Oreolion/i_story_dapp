import { createBrowserClient } from "@supabase/ssr";

// Singleton browser Supabase client using @supabase/ssr.
// Uses cookie-based sessions with PKCE auth flow (default).
// Replaces the old createClient + localStorage implicit flow.
const createSupabaseClient = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Ensure client-side token auto-refreshes write persistent cookies
      // (with maxAge), not session cookies. Without this, Firefox clears
      // the refreshed session on window close because document.cookie writes
      // default to session cookies (no expiry). Chrome silently restores
      // them via "Continue where you left off" — which is why this only
      // manifests in Firefox.
      cookieOptions: {
        maxAge: 60 * 60 * 24 * 400, // 400 days — matches Supabase max session lifetime
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    }
  );
};

export const supabaseClient =
  typeof window !== "undefined" ? createSupabaseClient() : null;