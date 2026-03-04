import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "USER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor"); // for pagination
  const take = 30;

  const txs = await prisma.transaction.findMany({
    where: { userId: token.id as string },
    orderBy: { createdAt: "desc" },
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: {
      merchantLinks: { include: { merchant: { select: { name: true, id: true } } } },
      admin: { select: { name: true } },
    },
  });

  const formatted = txs.map((tx: typeof txs[0]) => ({
    id: tx.id,
    amount: tx.amount,
    type: tx.type,
    status: tx.status,
    createdAt: tx.createdAt,
    clientTxId: tx.clientTxId,
    merchant: tx.type === "DEBIT"
      ? tx.merchantLinks[0]?.merchant.name ?? "Merchant"
      : tx.admin?.name ? `Top-up by ${tx.admin.name}` : "Wallet Top-up",
    merchantId: tx.merchantLinks[0]?.merchant.id ?? null,
  }));

  const nextCursor = txs.length === take ? txs[txs.length - 1].id : null;

  return NextResponse.json({ transactions: formatted, nextCursor });
}
