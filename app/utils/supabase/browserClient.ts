// app/utils/supabase/browserClient.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

declare global {
  // survive HMR: store a single instance on window
  // eslint-disable-next-line no-var
  var __supabase_client__: SupabaseClient | undefined;
}

export function getBrowserSupabase(): SupabaseClient {
  if (typeof window === "undefined") {
    throw new Error("getBrowserSupabase() called on the server.");
  }
  // reuse global instance (prevents multiple clients / storage races)
  const anyWin = window as any;
  if (anyWin.__supabase_client__) return anyWin.__supabase_client__;

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
      },
    }
  );

  anyWin.__supabase_client__ = client;
  return client;
}
