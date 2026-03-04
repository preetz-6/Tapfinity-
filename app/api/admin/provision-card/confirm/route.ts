import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { hashCardSecret } from "@/lib/hashCardSecret";

/* ===================== GET: POLL STATUS ===================== */
export async function GET(req: NextRequest) {
  const requestId = req.nextUrl.searchParams.get("requestId");

  if (!requestId) {
    return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
  }

  const request = await prisma.provisionCardRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  return NextResponse.json({ status: request.status });
}

/* ===================== POST: NFC TAP ===================== */
export async function POST(req: NextRequest) {
  try {
    const { requestId, cardSecret } = await req.json();

    if (!requestId || !cardSecret) {
      return NextResponse.json(
        { error: "Missing requestId or cardSecret" },
        { status: 400 }
      );
    }

    const request = await prisma.provisionCardRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return NextResponse.json({ error: "Invalid request" }, { status: 404 });
    }

    if (request.status !== "PENDING") {
      return NextResponse.json(
        { error: "Request already used or expired" },
        { status: 409 }
      );
    }

    if (request.expiresAt < new Date()) {
      await prisma.provisionCardRequest.update({
        where: { id: requestId },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json({ error: "Request expired" }, { status: 410 });
    }

    const cardSecretHash = hashCardSecret(cardSecret);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.user.updateMany({
        where: { cardSecretHash },
        data: { cardSecretHash: null },
      });

      await tx.user.update({
        where: { id: request.userId },
        data: { cardSecretHash },
      });

      await tx.provisionCardRequest.update({
        where: { id: requestId },
        data: { status: "COMPLETED" },
      });
    });

    return NextResponse.json({ ok: true, status: "COMPLETED" });

  } catch (err) {
    console.error("PROVISION CONFIRM ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}