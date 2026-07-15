import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

async function requireStaff(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "STAFF") {
    throw new Error("UNAUTHORIZED");
  }
  return token;
}

/* ===================== GET: STUDENT TRANSACTIONS ===================== */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireStaff(req);
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, balance: true, status: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        amount: true,
        type: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, user, transactions });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
