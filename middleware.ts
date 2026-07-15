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
    // Allow unauthenticated access to admin login page
    if (pathname === "/admin/login") {
      // If already authenticated as admin, redirect to dashboard
      if (token && token.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.next();
    }

    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    if (token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  /* ---------------- MERCHANT ROUTES ---------------- */
  if (pathname.startsWith("/merchant")) {
    // Allow unauthenticated access to merchant login page
    if (pathname === "/merchant/login") {
      if (token && token.role === "MERCHANT") {
        return NextResponse.redirect(new URL("/merchant", req.url));
      }
      return NextResponse.next();
    }

    if (!token) {
      return NextResponse.redirect(new URL("/merchant/login", req.url));
    }
    if (token.role !== "MERCHANT") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  /* ---------------- STAFF ROUTES ---------------- */
  if (pathname.startsWith("/staff")) {
    // Allow unauthenticated access to staff login page
    if (pathname === "/staff/login") {
      if (token && token.role === "STAFF") {
        return NextResponse.redirect(new URL("/staff", req.url));
      }
      return NextResponse.next();
    }

    if (!token) {
      return NextResponse.redirect(new URL("/staff/login", req.url));
    }
    if (token.role !== "STAFF") {
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
    "/staff/:path*",
    "/dashboard/:path*",
  ],
};
