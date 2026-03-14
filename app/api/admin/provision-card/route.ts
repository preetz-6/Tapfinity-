import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { verifyAdminPin } from "@/lib/verifyAdminPin";

export async function POST(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId, pin } = await req.json();

  if (!userId || !pin) {
    return NextResponse.json(
      { error: "User ID and PIN required" },
      { status: 400 }
    );
  }

  /* ---------- PIN VERIFICATION ---------- */
  const pinCheck = await verifyAdminPin(token.id as string, pin);
  if (!pinCheck.ok) {
    return NextResponse.json(
      { error: pinCheck.error },
      { status: 403 }
    );
  }

  /* ---------- EXPIRE OLD REQUESTS ---------- */
  await prisma.provisionCardRequest.updateMany({
    where: {
      userId,
      status: "PENDING",
    },
    data: { status: "EXPIRED" },
  });

  /* ---------- CREATE NEW REQUEST ---------- */
  const request = await prisma.provisionCardRequest.create({
    data: {
      userId,
      adminId: token.id as string,
      expiresAt: new Date(Date.now() + 60 * 1000), // 60s window
      status: "PENDING",
    },
  });


  return NextResponse.json({
    ok: true,
    requestId: request.id,
  });
}