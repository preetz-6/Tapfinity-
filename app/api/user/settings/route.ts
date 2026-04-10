import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "USER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: token.id as string },
    select: { dailySpendingLimit: true },
  });

  return NextResponse.json({ dailySpendingLimit: user?.dailySpendingLimit ?? null });
}

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "USER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { dailySpendingLimit } = await req.json();

  // null = remove limit, number = set limit (min ₹1, max ₹1,00,000)
  if (dailySpendingLimit !== null && (
    typeof dailySpendingLimit !== "number" ||
    dailySpendingLimit < 1 ||
    dailySpendingLimit > 100_000
  )) {
    return NextResponse.json({ error: "Limit must be between ₹1 and ₹1,00,000" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: token.id as string },
    data: { dailySpendingLimit: dailySpendingLimit === null ? null : Math.floor(dailySpendingLimit) },
  });

  return NextResponse.json({ ok: true, dailySpendingLimit: user.dailySpendingLimit });
}
