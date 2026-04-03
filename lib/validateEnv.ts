/**
 * Startup environment variable validation.
 *
 * Import this module in instrumentation.ts (Next.js 14+) so it runs
 * once at server startup — not per-request. Missing critical vars
 * will crash immediately with a clear message instead of failing
 * silently at payment time.
 */

type EnvCheck = {
  name: string;
  required: boolean;
  reason: string;
};

const ENV_CHECKS: EnvCheck[] = [
  // ─── Auth ───
  { name: "DATABASE_URL",            required: true,  reason: "Prisma cannot connect to the database" },
  { name: "NEXTAUTH_SECRET",         required: true,  reason: "NextAuth sessions will not work" },
  { name: "NEXTAUTH_URL",            required: true,  reason: "CSRF origin checks and OAuth callbacks will fail" },

  // ─── NFC Payments ───
  { name: "CARD_SECRET_SALT",        required: true,  reason: "Card provisioning and payment authorization rely on this salt" },

  // ─── Razorpay (optional but warned) ───
  { name: "RAZORPAY_WEBHOOK_SECRET", required: false, reason: "Razorpay webhook signature verification will be skipped" },

  // ─── Redis (optional — falls back to in-memory) ───
  { name: "UPSTASH_REDIS_REST_URL",   required: false, reason: "Rate limiting will fall back to in-memory (not suitable for serverless)" },
  { name: "UPSTASH_REDIS_REST_TOKEN", required: false, reason: "Rate limiting will fall back to in-memory (not suitable for serverless)" },
];

export function validateEnv() {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const check of ENV_CHECKS) {
    const value = process.env[check.name];
    if (!value || value.trim() === "") {
      if (check.required) {
        missing.push(`  ✗ ${check.name} — ${check.reason}`);
      } else {
        warnings.push(`  ⚠ ${check.name} — ${check.reason}`);
      }
    }
  }

  if (warnings.length > 0) {
    console.warn(
      `\n⚠️  TAPFINITY — Optional env vars missing:\n${warnings.join("\n")}\n`
    );
  }

  if (missing.length > 0) {
    console.error(
      `\n🚨 TAPFINITY — Required env vars missing:\n${missing.join("\n")}\n`
    );
    throw new Error(
      `Missing required environment variables:\n${missing.join("\n")}`
    );
  }
}
