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
      // Disable auto-refresh. Firefox's Enhanced Tracking Protection / Total
      // Cookie Protection silently blocks cross-origin requests to
      // *.supabase.co (categorized as trackers). When the auto-refresh timer
      // fires, it gets a NetworkError with status (null), corrupting the
      // auth state so getSession() returns null forever until reload.
      //
      // We handle refresh proactively in getAccessToken() via our same-origin
      // /api/auth/refresh proxy, which bypasses Firefox's blocklist.
      auth: {
        autoRefreshToken: false,
      },
      // Ensure client-side token writes persistent cookies (with maxAge),
      // not session cookies. Without this, Firefox clears the refreshed
      // session on window close because document.cookie writes default to
      // session cookies (no expiry). Chrome silently restores them via
      // "Continue where you left off".
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