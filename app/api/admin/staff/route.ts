import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { verifyAdminPin } from "@/lib/verifyAdminPin";

type AdminActionType = "CREATE_USER" | "DELETE_USER" | "BLOCK_USER" | "UNBLOCK_USER" | "REASSIGN_UID" | "TOP_UP" | "CREATE_ADMIN" | "BLOCK_ADMIN" | "CREATE_MERCHANT" | "BLOCK_MERCHANT" | "UNBLOCK_MERCHANT" | "CREATE_STAFF" | "BLOCK_STAFF" | "UNBLOCK_STAFF";

async function requireAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "ADMIN") {
    throw new Error("UNAUTHORIZED");
  }
  return token;
}

async function logAdminAction(params: {
  adminId: string;
  actionType: AdminActionType;
  targetType: string;
  targetIdentifier: string;
  metadata?: Record<string, unknown>;
  req: NextRequest;
}) {
  await prisma.adminActionLog.create({
    data: {
      adminId: params.adminId,
      actionType: params.actionType,
      targetType: params.targetType,
      targetIdentifier: params.targetIdentifier,
      metadata: params.metadata as never,
      ipAddress:
        params.req.headers.get("x-forwarded-for")?.split(",")[0] ??
        params.req.headers.get("x-real-ip") ??
        null,
      userAgent: params.req.headers.get("user-agent"),
    },
  });
}

/* ===================== GET: LIST STAFF ===================== */

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const staff = await prisma.staff.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, staff });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/* ===================== POST: CREATE STAFF ===================== */

export async function POST(req: NextRequest) {
  try {
    const token = await requireAdmin(req);
    const { name, email, password, pin } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    // PIN required for creating staff
    if (!pin) {
      return NextResponse.json(
        { error: "Admin PIN required" },
        { status: 403 }
      );
    }

    const adminId = token.id as string;
    const pinCheck = await verifyAdminPin(adminId, pin);
    if (!pinCheck.ok) {
      return NextResponse.json({ error: pinCheck.error }, { status: 403 });
    }

    const existing = await prisma.staff.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Staff member already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const staff = await prisma.staff.create({
      data: {
        name: name || email.split("@")[0],
        email,
        passwordHash,
        status: "ACTIVE",
      },
    });

    await logAdminAction({
      adminId,
      actionType: "CREATE_STAFF",
      targetType: "STAFF",
      targetIdentifier: staff.email,
      req,
    });

    return NextResponse.json({ ok: true, staff });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ===================== PATCH: BLOCK / UNBLOCK STAFF ===================== */

export async function PATCH(req: NextRequest) {
  try {
    const token = await requireAdmin(req);
    const { staffId, status, pin } = await req.json();

    if (!staffId || !status) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (!pin) {
      return NextResponse.json(
        { error: "Admin PIN required" },
        { status: 403 }
      );
    }

    const adminId = token.id as string;
    const pinCheck = await verifyAdminPin(adminId, pin);
    if (!pinCheck.ok) {
      return NextResponse.json({ error: pinCheck.error }, { status: 403 });
    }

    const staff = await prisma.staff.update({
      where: { id: staffId },
      data: { status },
    });

    await logAdminAction({
      adminId,
      actionType: status === "BLOCKED" ? "BLOCK_STAFF" : "UNBLOCK_STAFF",
      targetType: "STAFF",
      targetIdentifier: staff.email,
      req,
    });

    return NextResponse.json({ ok: true, staff });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
