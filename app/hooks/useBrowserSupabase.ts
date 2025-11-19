// app/hooks/useBrowserSupabase.ts
import { useEffect, useState } from "react";
import { supabaseClient } from "@/app/utils/supabase/supabaseClient";
import type { SupabaseClient } from "@supabase/supabase-js";

export function useBrowserSupabase(): SupabaseClient | null {
  const [client, setClient] = useState<SupabaseClient | null>(null);
  useEffect(() => {
    setClient(supabaseClient); // do NOT create a new client here
  }, []);
  return client;
}
