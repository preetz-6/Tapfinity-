import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || token.role !== "MERCHANT") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // ✅ THIS IS THE FIX
  const { id } = await context.params;

  const request = await prisma.paymentRequest.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!request) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ status: request.status });
}
