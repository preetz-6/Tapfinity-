import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { hashCardSecret } from "@/lib/hashCardSecret";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

/* ===================== GET: POLL STATUS ===================== */
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requestId = req.nextUrl.searchParams.get("requestId");
  if (!requestId)
    return NextResponse.json({ error: "Missing requestId" }, { status: 400 });

  const request = await prisma.provisionCardRequest.findUnique({
    where: { id: requestId },
  });

  if (!request)
    return NextResponse.json({ error: "Request not found" }, { status: 404 });

  // Only the admin who created the request can poll it
  if (request.adminId !== token.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({ status: request.status });
}

/* ===================== POST: NFC CONFIRM ===================== */
export async function POST(req: NextRequest) {
  // Must be an authenticated admin session
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit per IP — prevent rapid enumeration of requestIds
  const ip = getClientIp(req.headers);
  if (!rateLimit(ip, 3, 10_000))
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });

  try {
    const { requestId, cardSecret } = await req.json();

    if (!requestId || !cardSecret)
      return NextResponse.json(
        { error: "Missing requestId or cardSecret" },
        { status: 400 }
      );

    const request = await prisma.provisionCardRequest.findUnique({
      where: { id: requestId },
    });

    if (!request)
      return NextResponse.json({ error: "Invalid request" }, { status: 404 });

    // Only the admin who initiated provisioning can confirm it
    if (request.adminId !== token.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (request.status !== "PENDING")
      return NextResponse.json(
        { error: "Request already used or expired" },
        { status: 409 }
      );

    if (request.expiresAt < new Date()) {
      await prisma.provisionCardRequest.update({
        where: { id: requestId },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json({ error: "Request expired" }, { status: 410 });
    }

    const cardSecretHash = hashCardSecret(cardSecret);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Unlink this secret from any other user (re-provisioning)
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
