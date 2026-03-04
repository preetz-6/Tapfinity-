/**
 * 🔒 DISABLED — User registration is admin-only.
 * Users are created via POST /api/admin/users with an admin PIN.
 * This endpoint is intentionally disabled to prevent unauthorised account creation.
 */
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Self-registration is disabled. Contact your admin." },
    { status: 410 }
  );
}
