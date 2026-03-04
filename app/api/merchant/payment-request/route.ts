import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

const MAX_AMOUNT = 100_000; // ₹1 lakh hard cap per payment

async function requireMerchant(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "MERCHANT") throw new Error("UNAUTHORIZED");
  return token;
}

export async function POST(req: NextRequest) {
  try {
    const token = await requireMerchant(req);
    const body = await req.json();
    const amount = Number(body.amount);

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (amount > MAX_AMOUNT) {
      return NextResponse.json({ error: `Amount cannot exceed ₹${MAX_AMOUNT.toLocaleString("en-IN")}` }, { status: 400 });
    }

    const merchantId = token.id as string;

    // ── CLEANUP expired requests for this merchant (fire-and-forget) ──
    prisma.paymentRequest.updateMany({
      where: {
        merchantId,
        status: "PENDING",
        expiresAt: { lt: new Date() },
      },
      data: { status: "EXPIRED" },
    }).catch(() => {}); // Never block payment flow

    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    const request = await prisma.paymentRequest.create({
      data: { merchantId, amount, expiresAt },
    });

    return NextResponse.json({ ok: true, requestId: request.id, expiresAt });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("PAYMENT REQUEST ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
