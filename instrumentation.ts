/**
 * Next.js Instrumentation Hook (runs once at server startup).
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  // Only validate on the server (not during edge runtime or client build)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("./lib/validateEnv");
    validateEnv();
  }
}
