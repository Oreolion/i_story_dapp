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
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

export const supabaseClient =
  typeof window !== "undefined" ? createSupabaseClient() : null;