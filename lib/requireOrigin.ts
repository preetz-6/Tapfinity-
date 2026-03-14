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

  if (!allowed || !origin.startsWith(allowed)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null; // origin is valid, proceed
}
