import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status     = searchParams.get("status");     // SUCCESS | FAILED | ""
  const merchantId = searchParams.get("merchantId");
  const page       = Math.max(1, Number(searchParams.get("page") || "1"));
  const limit      = 50;
  const skip       = (page - 1) * limit;

  const where = {
    ...(status     ? { status: status as "SUCCESS" | "FAILED" } : {}),
    ...(merchantId ? { merchantId } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.paymentAttemptLog.findMany({
      where,
      include: {
        merchant: { select: { id: true, name: true, email: true } },
        user:     { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    prisma.paymentAttemptLog.count({ where }),
  ]);

  return NextResponse.json({ logs, total, page, pages: Math.ceil(total / limit) });
}
