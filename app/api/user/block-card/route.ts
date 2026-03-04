import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || token.role !== "USER") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const userId = token.id as string;

    // Check current status
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.status === "BLOCKED") {
      // Idempotent response
      return NextResponse.json({
        ok: true,
        status: "ALREADY_BLOCKED",
      });
    }

    // Block user (card)
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: "BLOCKED",
      },
    });

    return NextResponse.json({
      ok: true,
      status: "BLOCKED",
    });
  } catch (err) {
    console.error("BLOCK CARD ERROR:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
