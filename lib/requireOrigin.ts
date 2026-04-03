import { NextRequest, NextResponse } from "next/server";

/**
 * Rejects requests that don't originate from our own app.
 * Prevents CSRF — a malicious site can't silently hit our API
 * using a logged-in merchant's session cookie.
 */
export function requireOrigin(req: NextRequest): NextResponse | null {
  const origin = req.headers.get("origin");
  const allowed = process.env.NEXTAUTH_URL;

  // Allow requests with no origin header only in development
  // (server-to-server calls, curl, etc.)
  if (!origin) {
    if (process.env.NODE_ENV === "development") return null;
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Compare parsed origins to prevent bypass via subdomains
  // e.g. "https://tapfinity.com.evil.com" must NOT match "https://tapfinity.com"
  try {
    const allowedOrigin = new URL(allowed).origin;
    const requestOrigin = new URL(origin).origin;
    if (requestOrigin !== allowedOrigin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null; // origin is valid, proceed
}
