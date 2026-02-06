import { NextRequest, NextResponse } from "next/server";

// ============================================================================
// Rate Limiting Configuration
// ============================================================================

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const WINDOW_MS = 60_000; // 1 minute

// Cleanup expired entries periodically
let lastCleanup = Date.now();
function cleanupIfNeeded() {
  const now = Date.now();
  if (now - lastCleanup > WINDOW_MS * 2) {
    for (const [key, entry] of rateLimitStore) {
      if (now - entry.windowStart > WINDOW_MS) {
        rateLimitStore.delete(key);
      }
    }
    lastCleanup = now;
  }
}

function checkRateLimit(key: string, maxRequests: number): { allowed: boolean; remaining: number } {
  cleanupIfNeeded();
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count };
}

// ============================================================================
// Route-specific rate limits
// ============================================================================

function getRateLimit(pathname: string): number {
  // AI endpoints: stricter limits (expensive API calls)
  if (pathname.startsWith("/api/ai/")) return 10;

  // Auth endpoints: prevent brute force
  if (pathname.startsWith("/api/auth/")) return 20;

  // Email endpoint: prevent spam
  if (pathname === "/api/email/send") return 5;

  // Default for all other API routes
  if (pathname.startsWith("/api/")) return 60;

  // Non-API routes: no rate limiting
  return 0;
}

// ============================================================================
// Middleware
// ============================================================================

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only rate-limit API routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const maxRequests = getRateLimit(pathname);
  if (maxRequests === 0) {
    return NextResponse.next();
  }

  // Use IP + path prefix as rate limit key
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // Group by path prefix (e.g., /api/ai/* all share the same bucket)
  const pathPrefix = pathname.split("/").slice(0, 4).join("/");
  const rateLimitKey = `${ip}:${pathPrefix}`;

  const { allowed, remaining } = checkRateLimit(rateLimitKey, maxRequests);

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": String(maxRequests),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  // Continue with rate limit headers
  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(maxRequests));
  response.headers.set("X-RateLimit-Remaining", String(remaining));

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
