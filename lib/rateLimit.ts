/**
 * Rate Limiter — Upstash Redis (distributed) with in-memory fallback
 *
 * Production: Uses Upstash Redis so rate limits persist across serverless
 * instances and cold starts. Set UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN in your environment.
 *
 * Development: Falls back to an in-memory Map when Upstash credentials
 * are not available. This resets on restart but is fine for local dev.
 */

import { Redis } from "@upstash/redis";

// ── Upstash Redis client (created once, reused across requests) ──
let redis: Redis | null = null;

if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// ── In-memory fallback (development only) ──

type Entry = { count: number; windowStart: number };
const store = new Map<string, Entry>();

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now - entry.windowStart > 60_000) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

function inMemoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

// ── Public API ──

/**
 * @param key       identifier (IP, email, etc.)
 * @param limit     max requests allowed in window
 * @param windowMs  time window in ms
 * @returns true = allowed, false = rate limited
 */
export async function rateLimit(
  key: string,
  limit = 5,
  windowMs = 5000
): Promise<boolean> {
  // Sanitize key to prevent abuse
  const safeKey = String(key).slice(0, 64).replace(/[^\w.:@-]/g, "_");

  if (redis) {
    try {
      // Fixed-window counter: bucket by time window
      const windowId = Math.floor(Date.now() / windowMs);
      const redisKey = `tpf:rl:${safeKey}:${windowId}`;

      const count = await redis.incr(redisKey);

      if (count === 1) {
        // First request in this window — set expiry (window + 1s buffer)
        await redis.pexpire(redisKey, windowMs + 1000);
      }

      return count <= limit;
    } catch {
      // If Redis is unreachable, fall through to in-memory so payments
      // aren't blocked by a Redis outage. Log for visibility.
      console.warn("[rateLimit] Redis unreachable, falling back to in-memory");
    }
  }

  // Fallback: in-memory (dev, or Redis outage)
  return inMemoryRateLimit(safeKey, limit, windowMs);
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
