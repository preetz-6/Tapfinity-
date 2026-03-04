import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");

  if (signature !== expected) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);

  if (event.event !== "payment.captured") {
    return NextResponse.json({ ok: true });
  }

  const payment = event.payload.payment.entity;
  const orderId = payment.order_id;
  const amount = payment.amount / 100;

  const existing = await prisma.transaction.findUnique({
    where: { clientTxId: orderId },
  });

  if (existing) {
    return NextResponse.json({ ok: true });
  }

  const receipt = payment.notes?.receipt || payment.description || "";
  const userId = receipt.split("_")[1];

  if (!userId) {
    return NextResponse.json({ error: "User not resolved" }, { status: 400 });
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.user.update({
      where: { id: userId },
      data: { balance: { increment: amount } },
    });

    await tx.transaction.create({
      data: {
        userId,
        amount,
        type: "CREDIT",
        status: "SUCCESS",
        clientTxId: orderId,
      },
    });
  });

  return NextResponse.json({ ok: true });
}