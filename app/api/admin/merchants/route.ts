import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

/* ===================== HELPERS ===================== */

async function requireAdmin(req: NextRequest) {
  const token = (await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })) as {
    id: string;
    role: "ADMIN" | "USER" | "MERCHANT";
  } | null;

  if (!token || token.role !== "ADMIN") {
    throw new Error("UNAUTHORIZED");
  }

  return token;
}

/* ===================== GET: LIST MERCHANTS ===================== */

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const merchants = await prisma.merchant.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, merchants });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/* ===================== POST: CREATE MERCHANT ===================== */

export async function POST(req: NextRequest) {
  try {
    const token = await requireAdmin(req);
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const existing = await prisma.merchant.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Merchant already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const merchant = await prisma.merchant.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    await prisma.adminActionLog.create({
      data: {
        adminId: token.id,
        actionType: "CREATE_MERCHANT",
        targetType: "MERCHANT",
        targetIdentifier: merchant.email,
      },
    });

    return NextResponse.json({ ok: true, merchant });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

/* ===================== PATCH: BLOCK / UNBLOCK MERCHANT ===================== */

export async function PATCH(req: NextRequest) {
  try {
    const token = await requireAdmin(req);
    const { merchantId, status } = await req.json();

    if (!merchantId || !status) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    const merchant = await prisma.merchant.update({
      where: { id: merchantId },
      data: { status },
    });

    await prisma.adminActionLog.create({
      data: {
        adminId: token.id,
        actionType:
          status === "BLOCKED" ? "BLOCK_MERCHANT" : "UNBLOCK_MERCHANT",
        targetType: "MERCHANT",
        targetIdentifier: merchant.email,
      },
    });

    return NextResponse.json({ ok: true, merchant });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
