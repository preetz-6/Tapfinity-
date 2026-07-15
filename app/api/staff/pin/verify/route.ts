import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { verifyStaffPin } from "@/lib/verifyStaffPin";

async function requireStaff(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "STAFF") {
    throw new Error("UNAUTHORIZED");
  }
  return token;
}

/* ===================== POST: VERIFY PIN ===================== */

export async function POST(req: NextRequest) {
  try {
    const token = await requireStaff(req);
    const { pin } = await req.json();
    const staffId = token.id as string;

    if (!pin) {
      return NextResponse.json({ error: "PIN required" }, { status: 400 });
    }

    const result = await verifyStaffPin(staffId, pin);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
