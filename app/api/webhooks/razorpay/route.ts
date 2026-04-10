import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[razorpay] RAZORPAY_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature)
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(body)
    .digest("hex");

  const sigBuffer = Buffer.from(signature, "hex");
  const expBuffer = Buffer.from(expected, "hex");

  if (
    sigBuffer.length !== expBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expBuffer)
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);

  if (event.event !== "payment.captured")
    return NextResponse.json({ ok: true });

  const payment = event.payload.payment.entity;
  const orderId = payment.order_id;
  const amount  = payment.amount / 100;

  // Idempotency — ignore duplicate webhooks
  const existing = await prisma.transaction.findUnique({
    where: { clientTxId: orderId },
  });
  if (existing) return NextResponse.json({ ok: true });

  // TAP-004 FIX: Look up userId from our own DB — never trust the Razorpay payload
  // The PendingTopUp record was created by our server when the Razorpay order was created.
  const pendingTopUp = await prisma.pendingTopUp.findUnique({
    where: { orderId },
  });

  if (!pendingTopUp) {
    console.error(`[razorpay] No PendingTopUp found for orderId ${orderId}`);
    return NextResponse.json({ error: "Order not found" }, { status: 400 });
  }

  // Sanity check: amount must match what we originally created the order for
  if (pendingTopUp.amount !== amount) {
    console.error(`[razorpay] Amount mismatch for orderId ${orderId}: expected ${pendingTopUp.amount}, got ${amount}`);
    return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
  }

  const { userId } = pendingTopUp;

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.user.update({
      where: { id: userId },
      data: { balance: { increment: amount } },
    });

    await tx.transaction.create({
      data: {
        userId,
        amount,
        type:      "CREDIT",
        status:    "SUCCESS",
        clientTxId: orderId,
      },
    });

    // Clean up the pending record
    await tx.pendingTopUp.delete({ where: { orderId } });
  });

  return NextResponse.json({ ok: true });
}
