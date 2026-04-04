import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { verifyAdminPin } from "@/lib/verifyAdminPin";
type AdminActionType = "CREATE_USER" | "DELETE_USER" | "BLOCK_USER" | "UNBLOCK_USER" | "REASSIGN_UID" | "TOP_UP" | "CREATE_ADMIN" | "BLOCK_ADMIN" | "CREATE_MERCHANT" | "BLOCK_MERCHANT" | "UNBLOCK_MERCHANT";

/* ===================== HELPERS ===================== */

async function requireAdmin(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

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

/* ===================== GET: LIST USERS ===================== */

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        balance: true,
        status: true,
        cardSecretHash: true, // ✅ used only for UI (has card or not)
        createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, users });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/* ===================== POST: CREATE USER ===================== */

export async function POST(req: NextRequest) {
  try {
    const token = await requireAdmin(req);
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        status: "ACTIVE",
      },
    });

    await logAdminAction({
      adminId: token.id as string,
      actionType: "CREATE_USER",
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

/* ===================== PATCH: BLOCK / TOP-UP ===================== */

export async function PATCH(req: NextRequest) {
  try {
    const token = await requireAdmin(req);
    const body: {
      userId?: string;
      status?: "ACTIVE" | "BLOCKED";
      amount?: number;
      pin?: string;
    } = await req.json();

    const adminId = token.id as string;

    const isSensitive =
      body.status !== undefined || typeof body.amount === "number";

    /* ---------- PIN ENFORCEMENT ---------- */
    if (isSensitive) {
      if (!body.pin) {
        return NextResponse.json(
          { error: "PIN required for this action" },
          { status: 403 }
        );
      }

      const pinCheck = await verifyAdminPin(adminId, body.pin);
      if (!pinCheck.ok) {
        return NextResponse.json(
          { error: pinCheck.error },
          { status: 403 }
        );
      }
    }

    /* ---------- BLOCK / UNBLOCK ---------- */
    if (body.userId && body.status) {
      const user = await prisma.user.update({
        where: { id: body.userId },
        data: { status: body.status },
      });

      await logAdminAction({
        adminId,
        actionType:
          body.status === "BLOCKED" ? "BLOCK_USER" : "UNBLOCK_USER",
        targetType: "USER",
        targetIdentifier: user.email,
        req,
      });

      return NextResponse.json({ ok: true, user });
    }

    /* ---------- TOP-UP ---------- */
    if (body.userId && typeof body.amount === "number") {
      const user = await prisma.user.findUnique({
        where: { id: body.userId },
      });

      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      if (user.status !== "ACTIVE") {
        return NextResponse.json(
          { error: "Blocked users cannot be topped up" },
          { status: 403 }
        );
      }

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { balance: { increment: body.amount } },
      });

      const tx = await prisma.transaction.create({
        data: {
          userId: user.id,
          amount: body.amount,
          type: "CREDIT",
          status: "SUCCESS",
          approvedByAdminId: adminId,
          clientTxId: crypto.randomUUID(),
        },
      });

      await logAdminAction({
        adminId,
        actionType: "TOP_UP",
        targetType: "USER",
        targetIdentifier: user.email,
        metadata: { amount: body.amount, txId: tx.clientTxId },
        req,
      });

      return NextResponse.json({ ok: true, balance: updated.balance });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}