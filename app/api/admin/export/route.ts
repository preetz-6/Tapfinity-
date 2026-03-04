import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

function toCSV(rows: Record<string, string | number | null | undefined>[]) {
  if (!rows.length) return "";

  const headers = Object.keys(rows[0]);

  const csvRows = [
    headers.join(","),
    ...rows.map(row =>
      headers
        .map(field => {
          const value = row[field];
          const safe = value ?? "";
          return `"${safe.toString().replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ];

  return csvRows.join("\n");
}

export async function GET(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);

  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const merchantId = searchParams.get("merchantId");
  const userId = searchParams.get("userId");
  const status = searchParams.get("status"); // SUCCESS | FAILED

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "startDate and endDate required" },
      { status: 400 }
    );
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Safety limit: max 31 days
  const diffDays =
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays > 31) {
    return NextResponse.json(
      { error: "Date range cannot exceed 31 days" },
      { status: 400 }
    );
  }

  /* ===================== SUCCESS TRANSACTIONS ===================== */

  const successTransactions =
    status === "FAILED"
      ? []
      : await prisma.transaction.findMany({
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
            status: "SUCCESS",
            ...(userId ? { userId } : {}),
          },
          include: {
            user: true,
            merchantLinks: {
              include: {
                merchant: true,
              },
            },
          },
        });

  /* ===================== FAILED ATTEMPTS ===================== */

  const failedAttempts =
    status === "SUCCESS"
      ? []
      : await prisma.paymentAttemptLog.findMany({
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
            status: "FAILED",
            ...(merchantId ? { merchantId } : {}),
            ...(userId ? { userId } : {}),
          },
          include: {
            user: true,
            merchant: true,
          },
        });

  /* ===================== MERGE DATA ===================== */

  const successRows = successTransactions.flatMap((row: typeof successTransactions[0]) =>
    row.merchantLinks.map((link: typeof row.merchantLinks[0]) => ({
      Date: row.createdAt.toISOString(),
      UserEmail: row.user.email,
      MerchantName: link.merchant.name,
      Amount: row.amount,
      Status: "SUCCESS",
      Type: row.type,
      TransactionId: row.id,
      ClientTxId: row.clientTxId,
      IP: "",
    }))
  );

  const failedRows = failedAttempts.map((f: typeof failedAttempts[0]) => ({
    Date: f.createdAt.toISOString(),
    UserEmail: f.user?.email ?? "",
    MerchantName: f.merchant.name,
    Amount: f.amount,
    Status: "FAILED",
    Type: "DEBIT",
    TransactionId: "",
    ClientTxId: "",
    IP: f.ipAddress ?? "",
  }));

  const finalRows = [...successRows, ...failedRows];

  const csv = toCSV(finalRows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="tapfinity-audit-${Date.now()}.csv"`,
    },
  });
}