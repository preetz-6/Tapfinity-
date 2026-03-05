import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

async function requireMerchant(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "MERCHANT") throw new Error("UNAUTHORIZED");
  return token;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "MERCHANT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const request = await prisma.paymentRequest.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ status: request.status });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = await requireMerchant(req);
    const { id } = await context.params;

    // Only cancel if it belongs to this merchant and is still PENDING
    const updated = await prisma.paymentRequest.updateMany({
      where: {
        id,
        merchantId: token.id as string,
        status: "PENDING",
      },
      data: { status: "EXPIRED" },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "Not found or already processed" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
