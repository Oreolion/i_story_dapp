import { createClient } from "@supabase/supabase-js";
import { verifyMessage } from "viem"; // Keep for client-side if needed (optional)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side client
export const createSupabaseClient = () => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storageKey: "iStorySupabaseAuth",
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    },
  });

  // Listener for auth changes (e.g., Google sign-in) - attach after client creation
  supabase.auth.onAuthStateChange((event, session) => {
    console.log("Auth state changed:", event, session);
    // Trigger profile refetch in components via custom event or context
    if (event === "SIGNED_IN") {
      window.dispatchEvent(
        new CustomEvent("userSignedIn", { detail: session })
      );
    }
  });

  return supabase;
};

// Sig verification (client-safe)
export const verifyWalletSignature = async (
  address: `0x${string}`,
  message: string,
  signature: `0x${string}`
) => {
  return verifyMessage({ address, message, signature });
};

// Utility to fetch user data by wallet address (client-side)
export const fetchUserData = async (
  supabase: ReturnType<typeof createSupabaseClient>,
  walletAddress: string
) => {
  const { data, error } = await supabase
    .from("users")
    .select("*") // Fetch all columns; adjust based on your schema (e.g., add stories, followers if they exist)
    .eq("wallet_address", walletAddress)
    .single();

  if (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
  return data;
};