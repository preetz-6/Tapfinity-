import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

async function requireStaff(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "STAFF") {
    throw new Error("UNAUTHORIZED");
  }
  return token;
}

/* ===================== POST: SET PIN ===================== */

export async function POST(req: NextRequest) {
  try {
    const token = await requireStaff(req);
    const { pin } = await req.json();
    const staffId = token.id as string;

    if (!pin || !/^\d{6}$/.test(pin)) {
      return NextResponse.json(
        { error: "PIN must be exactly 6 digits" },
        { status: 400 }
      );
    }

    const pinHash = await bcrypt.hash(pin, 10);

    await prisma.staffPin.upsert({
      where: { staffId },
      update: {
        pinHash,
        failedAttempts: 0,
        isActive: true,
        rotatedAt: new Date(),
      },
      create: {
        staffId,
        pinHash,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
