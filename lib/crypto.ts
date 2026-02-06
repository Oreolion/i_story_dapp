import { timingSafeEqual } from "crypto";

/**
 * Constant-time string comparison to prevent timing attacks.
 * Used for comparing secrets like CRON_SECRET and ADMIN_SECRET.
 */
export function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "utf-8");
    const bufB = Buffer.from(b, "utf-8");

    // If lengths differ, we still need constant-time behavior.
    // Compare against a padded version to avoid timing leaks on length.
    if (bufA.length !== bufB.length) {
      // Compare bufA against itself to burn equal time, then return false
      timingSafeEqual(bufA, bufA);
      return false;
    }

    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}
