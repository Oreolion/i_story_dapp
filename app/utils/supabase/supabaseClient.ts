// app/utils/supabase/supabaseClient.ts
"use client";

import { createClient } from "@supabase/supabase-js";

// Create once and export
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);