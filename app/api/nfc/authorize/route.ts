import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { hashCardSecret } from "@/lib/hashCardSecret";

async function getTodaySpending(tx: Prisma.TransactionClient, userId: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const result = await tx.transaction.aggregate({
    where: { userId, type: "DEBIT", status: "SUCCESS", createdAt: { gte: startOfDay } },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);

  try {
    if (!rateLimit(ip, 5, 5000)) {
      return NextResponse.json({ ok: false, error: "Too many attempts. Please wait." }, { status: 429 });
    }

    let body: { requestId?: unknown; cardSecret?: unknown; confirmRotation?: unknown };
    try { body = await req.json(); }
    catch { return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 }); }

    const { requestId, cardSecret, confirmRotation } = body;

    if (typeof requestId !== "string" || !requestId.trim())
      return NextResponse.json({ ok: false, error: "Missing requestId" }, { status: 400 });
    if (typeof cardSecret !== "string" || !cardSecret.trim())
      return NextResponse.json({ ok: false, error: "Missing cardSecret" }, { status: 400 });
    if (requestId.length > 128 || cardSecret.length > 256)
      return NextResponse.json({ ok: false, error: "Invalid request parameters" }, { status: 400 });

    const secretHash = hashCardSecret(cardSecret);

    // ── Phase 2: Merchant confirms card was rewritten — commit the new secret ──
    // The merchant app calls back with confirmRotation=true + the nextSecret after rewriting the card
    if (confirmRotation === true) {
      const nextSecret = body.confirmRotation as unknown;
      if (typeof nextSecret !== "string") {
        return NextResponse.json({ ok: false, error: "Missing nextSecret for rotation" }, { status: 400 });
      }
      // handled below
    }

    const nextSecret = crypto.randomUUID();
    const nextSecretHash = hashCardSecret(nextSecret);

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Verify payment request is valid FIRST
      const paymentRequest = await tx.paymentRequest.findUnique({ where: { id: requestId } });
      if (!paymentRequest || paymentRequest.status !== "PENDING" || paymentRequest.expiresAt < new Date()) {
        throw new Error("REQUEST_ALREADY_PROCESSED");
      }

      // 2. Verify card BEFORE consuming request
      const user = await tx.user.findUnique({ where: { cardSecretHash: secretHash } });
      if (!user)                          throw new Error("CARD_NOT_PROVISIONED");
      if (user.status !== "ACTIVE")       throw new Error("USER_BLOCKED");
      if (user.balance < paymentRequest.amount) throw new Error("INSUFFICIENT_BALANCE");

      if (user.dailySpendingLimit !== null) {
        const todaySpent = await getTodaySpending(tx, user.id);
        if (todaySpent + paymentRequest.amount > user.dailySpendingLimit) {
          throw new Error("DAILY_LIMIT_EXCEEDED");
        }
      }

      // 3. All checks passed — atomically consume + debit
      const locked = await tx.paymentRequest.updateMany({
        where: { id: requestId, status: "PENDING" },
        data: { status: "USED" },
      });
      if (locked.count === 0) throw new Error("REQUEST_ALREADY_PROCESSED");

      // NOTE: We do NOT rotate cardSecretHash here.
      // The merchant app writes the new secret to the card first,
      // then calls /api/nfc/rotate-secret to commit it.
      // This way a failed card write never breaks the user's card.
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: paymentRequest.amount } },
      });

      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          amount: paymentRequest.amount,
          type: "DEBIT",
          status: "SUCCESS",
          clientTxId: crypto.randomUUID(),
        },
      });

      await tx.merchantTransaction.create({
        data: { merchantId: paymentRequest.merchantId, txId: transaction.id },
      });

      await tx.paymentAttemptLog.create({
        data: {
          merchantId: paymentRequest.merchantId,
          userId: user.id,
          paymentRequestId: requestId,
          amount: paymentRequest.amount,
          status: "SUCCESS",
          ipAddress: ip,
        },
      });

      return { updatedUser, transaction, user, paymentRequest };
    });

    return NextResponse.json({
      ok: true,
      transactionId: result.transaction.id,
      balance: result.updatedUser.balance,
      user: { name: result.user.name, email: result.user.email },
      // Send next secret — merchant writes it to card, then calls /api/nfc/rotate-secret
      nextSecret,
      userId: result.user.id,
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
