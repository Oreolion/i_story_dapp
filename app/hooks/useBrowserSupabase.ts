import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/app/utils/supabase/browserClient";
import type { SupabaseClient } from "@supabase/supabase-js";

export function useBrowserSupabase(): SupabaseClient | null {
  const [client, setClient] = useState<SupabaseClient | null>(null);
  useEffect(() => {
    setClient(getBrowserSupabase());
  }, []);
  return client;
}
