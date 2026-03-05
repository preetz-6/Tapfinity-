import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { hashCardSecret } from "@/lib/hashCardSecret";

export async function POST(req: NextRequest) {
  // Only merchants can confirm a card rotation
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "MERCHANT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { userId?: unknown; nextSecret?: unknown };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const { userId, nextSecret } = body;
  if (typeof userId !== "string" || typeof nextSecret !== "string") {
    return NextResponse.json({ error: "Missing userId or nextSecret" }, { status: 400 });
  }

  const nextSecretHash = hashCardSecret(nextSecret);

  await prisma.user.update({
    where: { id: userId },
    data: { cardSecretHash: nextSecretHash },
  });

  return NextResponse.json({ ok: true });
}
