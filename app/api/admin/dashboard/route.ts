import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    totalUsers, activeUsers, blockedUsers, totalBalanceAgg,
    totalMerchants, activeMerchants, blockedMerchants,
    txTypeSplit, recentTransactions, recentActions, failedAttempts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { status: "BLOCKED" } }),
    prisma.user.aggregate({ _sum: { balance: true } }),
    prisma.merchant.count(),
    prisma.merchant.count({ where: { status: "ACTIVE" } }),
    prisma.merchant.count({ where: { status: "BLOCKED" } }),
    prisma.transaction.groupBy({ by: ["type"], _count: { _all: true } }),
    prisma.transaction.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { email: true } } },
    }),
    prisma.adminActionLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { admin: { select: { name: true } } },
    }),
    // Failed payment attempts in last 24h — for abuse detection
    prisma.paymentAttemptLog.findMany({
      where: {
        status: "FAILED",
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { merchant: { select: { name: true } } },
    }),
  ]);

  // ── PROPER DATE-GROUPED CHART ──
  // Use raw SQL to GROUP BY DATE — avoids the groupBy timestamp bug
  type DayRow = { day: string; count: bigint };
  const rawRows = await prisma.$queryRaw<DayRow[]>`
    SELECT
      TO_CHAR("createdAt" AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') AS day,
      COUNT(*)::int AS count
    FROM "Transaction"
    WHERE "createdAt" >= NOW() - INTERVAL '7 days'
    GROUP BY day
    ORDER BY day ASC
  `;

  // Ensure all 7 days are present even if no transactions
  const txByDay = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const day = d.toLocaleDateString("en-CA"); // YYYY-MM-DD in local
    const found = rawRows.find((r: DayRow) => r.day === day);
    return { day, count: found ? Number(found.count) : 0 };
  });

  // Group failed attempts by failure reason for the alert panel
    const failureBreakdown: Record<string, number> = failedAttempts.reduce((acc: Record<string, number>, a) => {    const key = a.failureReason ?? "UNKNOWN";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    kpis: {
      users: { total: totalUsers, active: activeUsers, blocked: blockedUsers, totalBalance: totalBalanceAgg._sum.balance ?? 0 },
      merchants: { total: totalMerchants, active: activeMerchants, blocked: blockedMerchants },
    },
    txByDay,
    txTypeSplit,
    recentTransactions,
    recentActions,
    failedAttempts: {
      total: failedAttempts.length,
      breakdown: failureBreakdown,
      recent: failedAttempts.slice(0, 5),
    },
  });
}