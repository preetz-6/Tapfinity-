import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

type TxType = "DEBIT" | "CREDIT";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const take = Math.min(Number(searchParams.get("take") ?? "50"), 200);
  const cursor = searchParams.get("cursor") ?? undefined;
  const typeFilter = searchParams.get("type") as TxType | null;

  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    where: typeFilter ? { type: typeFilter } : undefined,
    include: {
      user: { select: { email: true, name: true } },
      merchantLinks: { include: { merchant: { select: { name: true } } } },
    },
  });

  const nextCursor = transactions.length === take ? transactions[transactions.length - 1].id : null;

  return NextResponse.json({ transactions, nextCursor });
}
