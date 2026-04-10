import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: merchantId } = await params;

  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: { id: true, name: true, email: true },
  });

  if (!merchant)
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });

  const txs = await prisma.merchantTransaction.findMany({
    where: { merchantId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      tx: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  const transactions = txs.map(mt => ({
    id:        mt.tx.id,
    amount:    mt.tx.amount,
    status:    mt.tx.status,
    createdAt: mt.tx.createdAt,
    user:      mt.tx.user,
  }));

  const totalRevenue = transactions
    .filter(t => t.status === "SUCCESS")
    .reduce((s, t) => s + t.amount, 0);

  return NextResponse.json({ merchant, transactions, totalRevenue });
}
