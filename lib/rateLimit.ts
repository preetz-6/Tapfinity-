/**
 * Rate Limiter — in-memory, sliding window
 * 
 * NOTE: In serverless/edge environments this resets per cold start.
 * For production, replace with Redis (Upstash) or similar persistent store.
 * 
 * Security: Sanitizes the key to prevent Map-key poisoning.
 * Also validates x-forwarded-for to use only the first (real) IP.
 */

type Entry = {
  count: number;
  windowStart: number;
};

const store = new Map<string, Entry>();

// Cleanup old entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now - entry.windowStart > 60_000) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * @param key   identifier (IP, userId, etc.)
 * @param limit max requests allowed in window
 * @param windowMs  time window in ms
 * @returns true = allowed, false = rate limited
 */
export function rateLimit(key: string, limit = 5, windowMs = 5000): boolean {
  // Sanitize key to prevent abuse
  const safeKey = String(key).slice(0, 64).replace(/[^\w.:@-]/g, "_");

  const now = Date.now();
  const entry = store.get(safeKey);

  if (!entry || now - entry.windowStart > windowMs) {
    store.set(safeKey, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Extract the real client IP from request headers.
 * Avoids trusting all x-forwarded-for entries blindly.
 */
export function getClientIp(headers: Headers): string {
  // x-real-ip is set directly by Vercel/nginx and is more trustworthy
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  // x-forwarded-for can contain a chain: "client, proxy1, proxy2"
  // Only the first value is the real client IP (when behind a trusted proxy)
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }

  return "unknown";
}
