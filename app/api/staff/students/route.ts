import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { verifyStaffPin } from "@/lib/verifyStaffPin";

type AdminActionType = "CREATE_USER" | "DELETE_USER" | "BLOCK_USER" | "UNBLOCK_USER" | "REASSIGN_UID" | "TOP_UP" | "CREATE_ADMIN" | "BLOCK_ADMIN" | "CREATE_MERCHANT" | "BLOCK_MERCHANT" | "UNBLOCK_MERCHANT" | "CREATE_STAFF" | "BLOCK_STAFF" | "UNBLOCK_STAFF";

async function requireStaff(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "STAFF") {
    throw new Error("UNAUTHORIZED");
  }
  return token;
}

async function logStaffAction(params: {
  staffId: string;
  actionType: AdminActionType;
  targetType: string;
  targetIdentifier: string;
  metadata?: Record<string, unknown>;
  req: NextRequest;
}) {
  await prisma.adminActionLog.create({
    data: {
      staffId: params.staffId,
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

/* ===================== GET: LIST STUDENTS ===================== */

export async function GET(req: NextRequest) {
  try {
    await requireStaff(req);

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        balance: true,
        status: true,
        cardSecretHash: true,
        createdAt: true,
      },
    });

    const safeUsers = users.map((u: any) => ({
      ...u,
      hasCard: !!u.cardSecretHash,
      cardSecretHash: undefined,
    }));

    return NextResponse.json({ ok: true, users: safeUsers });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/* ===================== PATCH: BLOCK / UNBLOCK ===================== */

export async function PATCH(req: NextRequest) {
  try {
    const token = await requireStaff(req);
    const body: {
      userId?: string;
      status?: "ACTIVE" | "BLOCKED";
      pin?: string;
    } = await req.json();

    const staffId = token.id as string;

    if (!body.userId || !body.status) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    /* ---------- PIN ENFORCEMENT ---------- */
    if (!body.pin) {
      return NextResponse.json(
        { error: "PIN required for this action" },
        { status: 403 }
      );
    }

    const pinCheck = await verifyStaffPin(staffId, body.pin);
    if (!pinCheck.ok) {
      return NextResponse.json(
        { error: pinCheck.error },
        { status: 403 }
      );
    }

    /* ---------- BLOCK / UNBLOCK ---------- */
    const user = await prisma.user.update({
      where: { id: body.userId },
      data: { status: body.status },
    });

    await logStaffAction({
      staffId,
      actionType: body.status === "BLOCKED" ? "BLOCK_USER" : "UNBLOCK_USER",
      targetType: "USER",
      targetIdentifier: user.email,
      req,
    });

    return NextResponse.json({ ok: true, user });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
