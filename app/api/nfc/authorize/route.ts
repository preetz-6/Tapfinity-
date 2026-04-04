import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { hashCardSecret } from "@/lib/hashCardSecret";
import { requireOrigin } from "@/lib/requireOrigin";

async function getTodaySpending(tx: Prisma.TransactionClient, userId: string): Promise<number> {
  // Compute start-of-day in IST (UTC+5:30) regardless of server timezone.
  // Vercel runs in UTC — setHours(0,0,0,0) would give UTC midnight, not IST.
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST = UTC + 5:30
  const istNow = new Date(now.getTime() + istOffset);
  const istMidnight = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate()));
  const startOfDay = new Date(istMidnight.getTime() - istOffset); // convert IST midnight back to UTC
  const result = await tx.transaction.aggregate({
    where: { userId, type: "DEBIT", status: "SUCCESS", createdAt: { gte: startOfDay } },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

export async function POST(req: NextRequest) {
  // Block cross-origin requests (CSRF protection)
  const originError = requireOrigin(req);
  if (originError) return originError;

  const ip = getClientIp(req.headers);

  try {
    if (!(await rateLimit(ip, 5, 5000))) {
      return NextResponse.json({ ok: false, error: "Too many attempts. Please wait." }, { status: 429 });
    }

    let body: { requestId?: unknown; cardSecret?: unknown };
    try { body = await req.json(); }
    catch { return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 }); }

    const { requestId, cardSecret } = body;

    if (typeof requestId !== "string" || !requestId.trim())
      return NextResponse.json({ ok: false, error: "Missing requestId" }, { status: 400 });
    if (typeof cardSecret !== "string" || !cardSecret.trim())
      return NextResponse.json({ ok: false, error: "Missing cardSecret" }, { status: 400 });

    // UUID is 36 chars — reject anything suspiciously short or long
    if (requestId.length > 128)
      return NextResponse.json({ ok: false, error: "Invalid request parameters" }, { status: 400 });
    if (cardSecret.length < 32 || cardSecret.length > 256)
      return NextResponse.json({ ok: false, error: "Invalid card secret" }, { status: 400 });

    const secretHash = hashCardSecret(cardSecret);

    // Track context for failure logging (populated as we go)
    const failureContext: {
      merchantId?: string;
      userId?: string;
      amount?: number;
    } = {};

    try {
      const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 1. Verify payment request is valid FIRST
        const paymentRequest = await tx.paymentRequest.findUnique({ where: { id: requestId } });
        if (!paymentRequest || paymentRequest.status !== "PENDING" || paymentRequest.expiresAt < new Date()) {
          throw new Error("REQUEST_ALREADY_PROCESSED");
        }

        // Capture context for potential failure log
        failureContext.merchantId = paymentRequest.merchantId;
        failureContext.amount     = paymentRequest.amount;

        // 2. Verify card BEFORE consuming the request
        const user = await tx.user.findUnique({ where: { cardSecretHash: secretHash } });
        if (!user)                                throw new Error("CARD_NOT_PROVISIONED");

        failureContext.userId = user.id;

        if (user.status !== "ACTIVE")             throw new Error("USER_BLOCKED");
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

        // Log SUCCESS inside transaction
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

        return { updatedUser, transaction, user };
      });

      return NextResponse.json({
        ok: true,
        transactionId: result.transaction.id,
        balance: result.updatedUser.balance,
        user: { name: result.user.name, email: result.user.email },
      });

    } catch (txErr: unknown) {
      // Transaction rolled back — log the failure OUTSIDE in a separate query
      const reason = txErr instanceof Error ? txErr.message : "UNKNOWN";

      // Only log if we have enough context (i.e. request was found)
      if (failureContext.merchantId) {
        try {
          await prisma.paymentAttemptLog.create({
            data: {
              merchantId:       failureContext.merchantId,
              userId:           failureContext.userId ?? null,
              paymentRequestId: requestId,
              amount:           failureContext.amount ?? 0,
              status:           "FAILED",
              failureReason:    reason,
              ipAddress:        ip,
            },
          });
        } catch {
          // Don't let logging failure break the response
        }
      }

      return NextResponse.json({ ok: false, error: reason }, { status: 400 });
    }

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
