import { createClient } from "@supabase/supabase-js";

// This is the new singleton pattern.
// We create the client one time, right here.
const createSupabaseClient = () => {
  if (typeof window === "undefined") {
    // This should not be called on the server, but as a fallback, return null or a server client.
    // However, since we use this in client components, we'll rely on the check below.
    return null;
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window.localStorage, // browser-only
      },
    }
  );
};

// We check for 'window' to ensure this only runs on the client.
// On the server, supabaseClient will be null.
export const supabaseClient =
  typeof window !== "undefined" ? createSupabaseClient() : null;