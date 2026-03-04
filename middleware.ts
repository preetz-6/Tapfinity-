import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const pathname = req.nextUrl.pathname;

  /* ---------------- ADMIN ROUTES ---------------- */
  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  /* ---------------- MERCHANT ROUTES ---------------- */
  if (pathname.startsWith("/merchant")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (token.role !== "MERCHANT") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  /* ---------------- USER DASHBOARD ---------------- */
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (token.role !== "USER") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/merchant/:path*",
    "/dashboard/:path*",
  ],
};
