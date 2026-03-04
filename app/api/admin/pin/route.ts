import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

const MAX_FAILED_ATTEMPTS = 5;

/* ===================== SET / ROTATE PIN ===================== */
export async function POST(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pin } = await req.json();

  if (!pin || !/^\d{6}$/.test(pin)) {
    return NextResponse.json(
      { error: "PIN must be exactly 6 digits" },
      { status: 400 }
    );
  }

  const pinHash = await bcrypt.hash(pin, 10);

  const existingPin = await prisma.adminPin.findUnique({
    where: { adminId: token.id as string },
  });

  if (existingPin) {
    await prisma.adminPin.update({
      where: { adminId: token.id as string },
      data: {
        pinHash,
        failedAttempts: 0,
        isActive: true,
        rotatedAt: new Date(),
      },
    });
  } else {
    await prisma.adminPin.create({
      data: {
        adminId: token.id as string,
        pinHash,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
