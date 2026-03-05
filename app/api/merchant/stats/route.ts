import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

type MerchantTx = {
  tx: { amount: number; status: string };
};

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "MERCHANT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const merchantId = token.id as string;
  const now = new Date();
  const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
  const startOfWeek  = new Date(now); startOfWeek.setDate(now.getDate() - 7);
  const startOfMonth = new Date(now); startOfMonth.setDate(now.getDate() - 30);

  const [todayTxs, weekTxs, monthTxs, totalTxs, failedToday] = await Promise.all([
    prisma.merchantTransaction.findMany({
      where: { merchantId, createdAt: { gte: startOfToday } },
      include: { tx: { select: { amount: true, status: true } } },
    }),
    prisma.merchantTransaction.findMany({
      where: { merchantId, createdAt: { gte: startOfWeek } },
      include: { tx: { select: { amount: true, status: true } } },
    }),
    prisma.merchantTransaction.findMany({
      where: { merchantId, createdAt: { gte: startOfMonth } },
      include: { tx: { select: { amount: true, status: true } } },
    }),
    prisma.merchantTransaction.count({ where: { merchantId } }),
    prisma.paymentAttemptLog.count({
      where: { merchantId, status: "FAILED", createdAt: { gte: startOfToday } },
    }),
  ]);

  const sum = (txs: MerchantTx[]) =>
    txs.filter((t: MerchantTx) => t.tx.status === "SUCCESS")
       .reduce((s: number, t: MerchantTx) => s + t.tx.amount, 0);

  return NextResponse.json({
    today:  { revenue: sum(todayTxs),  count: todayTxs.length },
    week:   { revenue: sum(weekTxs),   count: weekTxs.length },
    month:  { revenue: sum(monthTxs),  count: monthTxs.length },
    total:  { count: totalTxs },
    failedToday,
  });
}