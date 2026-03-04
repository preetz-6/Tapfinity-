import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || token.role !== "MERCHANT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const merchantId = token.id as string;

  const txs = await prisma.merchantTransaction.findMany({
    where: { merchantId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      tx: {
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  return NextResponse.json({
    transactions: txs.map((t: typeof txs[0]) => t.tx),
  });
}