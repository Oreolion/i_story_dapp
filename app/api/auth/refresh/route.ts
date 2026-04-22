import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * POST /api/auth/refresh
 *
 * Same-origin proxy for Supabase session refresh.
 *
 * Firefox's Enhanced Tracking Protection / Total Cookie Protection silently
 * blocks cross-origin requests to *.supabase.co (categorized as trackers).
 * When the Supabase browser client's auto-refresh fires, it gets a NetworkError
 * with status (null), corrupting the auth state and causing all subsequent
 * getSession() calls to fail.
 *
 * By disabling auto-refresh in the browser client and routing refresh through
 * this same-origin endpoint, we bypass Firefox's blocklist entirely. The
 * server-side Supabase client has full cookie access and refreshes the session
 * without any browser privacy interference.
 */
export async function POST() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map(({ name, value }) => ({ name, value }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set({ name, value, ...options });
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.refreshSession();

  if (error || !data.session) {
    return NextResponse.json(
      { error: error?.message || "No active session" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    access_token: data.session.access_token,
    expires_at: data.session.expires_at,
  });
}
