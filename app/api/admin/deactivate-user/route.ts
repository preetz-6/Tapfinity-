import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { verifyAdminPin } from "@/lib/verifyAdminPin";
import type { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { userId, pin } = await req.json();
    if (!userId || !pin)
      return NextResponse.json({ error: "User ID and PIN required" }, { status: 400 });

    // Require PIN — this is a destructive action
    const pinCheck = await verifyAdminPin(token.id as string, pin);
    if (!pinCheck.ok)
      return NextResponse.json({ error: pinCheck.error }, { status: 403 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // If user had a balance, create a refund record before zeroing
      if (user.balance > 0) {
        await tx.transaction.create({
          data: {
            userId,
            amount:     user.balance,
            type:       "CREDIT",
            status:     "SUCCESS",
            clientTxId: `DEACTIVATE_REFUND_${userId}_${Date.now()}`,
          },
        });
      }

      await tx.user.update({
        where: { id: userId },
        data: { status: "BLOCKED", cardSecretHash: null, balance: 0 },
      });

      await tx.provisionCardRequest.updateMany({
        where: { userId, status: "PENDING" },
        data:  { status: "EXPIRED" },
      });

      await tx.adminActionLog.create({
        data: {
          adminId:          token.id as string,
          actionType:       "DELETE_USER",
          targetType:       "USER",
          targetIdentifier: user.email,
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DEACTIVATE USER ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
