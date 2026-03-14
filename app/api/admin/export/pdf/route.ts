import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const startDate  = searchParams.get("startDate");
  const endDate    = searchParams.get("endDate");
  const merchantId = searchParams.get("merchantId");
  const userId     = searchParams.get("userId");
  const status     = searchParams.get("status");

  if (!startDate || !endDate)
    return NextResponse.json({ error: "startDate and endDate required" }, { status: 400 });

  const start = new Date(startDate);
  const end   = new Date(endDate);

  const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays > 31)
    return NextResponse.json({ error: "Date range cannot exceed 31 days" }, { status: 400 });

  const successTransactions = status === "FAILED" ? [] : await prisma.transaction.findMany({
    where: {
      createdAt: { gte: start, lte: end },
      status: "SUCCESS",
      ...(userId ? { userId } : {}),
    },
    include: {
      user: true,
      merchantLinks: { include: { merchant: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const failedAttempts = status === "SUCCESS" ? [] : await prisma.paymentAttemptLog.findMany({
    where: {
      createdAt: { gte: start, lte: end },
      status: "FAILED",
      ...(merchantId ? { merchantId } : {}),
      ...(userId ? { userId } : {}),
    },
    include: { user: true, merchant: true },
    orderBy: { createdAt: "desc" },
  });

  type Row = {
    date: string; user: string; merchant: string;
    amount: number; status: string; reason: string; txId: string;
  };

  const rows: Row[] = [
    ...successTransactions.flatMap((tx: typeof successTransactions[0]) =>
      tx.merchantLinks.map((link: typeof tx.merchantLinks[0]) => ({
        date:     new Date(tx.createdAt).toLocaleString("en-IN"),
        user:     tx.user.email,
        merchant: link.merchant.name,
        amount:   tx.amount,
        status:   "SUCCESS",
        reason:   "",
        txId:     tx.id.slice(-8),
      }))
    ),
    ...failedAttempts.map((f: typeof failedAttempts[0]) => ({
      date:     new Date(f.createdAt).toLocaleString("en-IN"),
      user:     f.user?.email ?? "Unknown",
      merchant: f.merchant.name,
      amount:   f.amount,
      status:   "FAILED",
      reason:   f.failureReason ?? "",
      txId:     "—",
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalSuccess = rows.filter(r => r.status === "SUCCESS").reduce((s, r) => s + r.amount, 0);
  const totalFailed  = rows.filter(r => r.status === "FAILED").length;
  const generatedAt  = new Date().toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" });
  const rangeLabel   = `${start.toLocaleDateString("en-IN", { dateStyle: "medium" })} — ${end.toLocaleDateString("en-IN", { dateStyle: "medium" })}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Tapfinity Audit Report · ${rangeLabel}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #fff; color: #111; font-size: 12px; }
  @page { margin: 18mm 14mm; size: A4; }

  .page { max-width: 900px; margin: 0 auto; padding: 32px 24px; }

  /* Header */
  .header { display: flex; align-items: flex-start; justify-content: space-between; padding-bottom: 20px; border-bottom: 2px solid #111; margin-bottom: 24px; }
  .logo { display: flex; align-items: center; gap: 10px; }
  .logo-mark { width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(135deg, #3b82f6, #6366f1); display: flex; align-items: center; justify-content: center; }
  .logo-mark svg { width: 20px; height: 20px; stroke: white; fill: none; stroke-width: 1.5; }
  .logo-text { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }
  .logo-sub { font-size: 10px; color: #6b7280; margin-top: 1px; letter-spacing: 0.05em; text-transform: uppercase; }
  .header-right { text-align: right; }
  .report-title { font-size: 16px; font-weight: 700; }
  .report-meta { font-size: 10px; color: #6b7280; margin-top: 4px; }

  /* Summary */
  .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .stat { border: 1.5px solid #e5e7eb; border-radius: 10px; padding: 14px 16px; }
  .stat-label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
  .stat-value { font-size: 22px; font-weight: 900; }
  .stat-sub { font-size: 10px; color: #9ca3af; margin-top: 3px; }
  .green { color: #059669; border-color: #d1fae5; background: #f0fdf4; }
  .red   { color: #dc2626; border-color: #fee2e2; background: #fff5f5; }

  /* Filters used */
  .filters { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 20px; }
  .filter-chip { background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 99px; padding: 3px 10px; font-size: 10px; color: #374151; }

  /* Table */
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  thead { background: #111; color: #fff; }
  th { padding: 10px 12px; text-align: left; font-weight: 600; letter-spacing: 0.04em; font-size: 10px; text-transform: uppercase; white-space: nowrap; }
  td { padding: 9px 12px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #fafafa; }
  .badge { display: inline-flex; align-items: center; gap: 5px; padding: 2px 8px; border-radius: 99px; font-size: 10px; font-weight: 600; }
  .badge-success { background: #d1fae5; color: #065f46; }
  .badge-failed  { background: #fee2e2; color: #991b1b; }
  .dot { width: 5px; height: 5px; border-radius: 50%; }
  .dot-success { background: #10b981; }
  .dot-failed  { background: #ef4444; }
  .mono { font-family: "SF Mono", "Fira Code", monospace; font-size: 10px; color: #6b7280; }
  .amount-success { font-weight: 700; }
  .amount-failed  { font-weight: 400; color: #9ca3af; text-decoration: line-through; }
  .reason { font-size: 10px; color: #dc2626; }

  /* Footer */
  .footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; color: #9ca3af; font-size: 10px; }

  /* Print only */
  @media print {
    .no-print { display: none !important; }
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  }

  /* Screen only */
  @media screen {
    body { background: #f9fafb; }
    .page { background: #fff; margin: 24px auto; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .print-btn { position: fixed; top: 20px; right: 20px; background: #111; color: #fff; border: none; border-radius: 10px; padding: 10px 20px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 100; }
    .print-btn:hover { background: #374151; }
  }
</style>
</head>
<body>

<button class="print-btn no-print" onclick="window.print()">
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
  Save as PDF
</button>

<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="logo">
      <div class="logo-mark">
        <svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 12a4 4 0 0 1-8 0"/></svg>
      </div>
      <div>
        <div class="logo-text">Tapfinity</div>
        <div class="logo-sub">Campus NFC Payments</div>
      </div>
    </div>
    <div class="header-right">
      <div class="report-title">Audit & Transaction Report</div>
      <div class="report-meta">${rangeLabel}</div>
      <div class="report-meta">Generated ${generatedAt}</div>
    </div>
  </div>

  <!-- Summary -->
  <div class="summary">
    <div class="stat">
      <div class="stat-label">Total Transactions</div>
      <div class="stat-value">${rows.length}</div>
      <div class="stat-sub">attempts logged</div>
    </div>
    <div class="stat green">
      <div class="stat-label">Successful</div>
      <div class="stat-value">${rows.filter(r => r.status === "SUCCESS").length}</div>
      <div class="stat-sub">₹${totalSuccess.toLocaleString("en-IN")} collected</div>
    </div>
    <div class="stat red">
      <div class="stat-label">Failed</div>
      <div class="stat-value">${totalFailed}</div>
      <div class="stat-sub">declined attempts</div>
    </div>
    <div class="stat">
      <div class="stat-label">Success Rate</div>
      <div class="stat-value">${rows.length > 0 ? Math.round((rows.filter(r => r.status === "SUCCESS").length / rows.length) * 100) : 0}%</div>
      <div class="stat-sub">of all attempts</div>
    </div>
  </div>

  <!-- Active filters -->
  <div class="filters">
    <span class="filter-chip">Period: ${rangeLabel}</span>
    ${status ? `<span class="filter-chip">Status: ${status}</span>` : ""}
    ${merchantId ? `<span class="filter-chip">Merchant filtered</span>` : ""}
    ${userId ? `<span class="filter-chip">User filtered</span>` : ""}
    ${!status && !merchantId && !userId ? `<span class="filter-chip">All merchants · All users</span>` : ""}
  </div>

  <!-- Table -->
  <table>
    <thead>
      <tr>
        <th>Date & Time</th>
        <th>Status</th>
        <th>Amount</th>
        <th>User</th>
        <th>Merchant</th>
        <th>Ref</th>
      </tr>
    </thead>
    <tbody>
      ${rows.length === 0
        ? `<tr><td colspan="6" style="text-align:center;padding:32px;color:#9ca3af;">No records found for this period</td></tr>`
        : rows.map(r => `
          <tr>
            <td class="mono">${r.date}</td>
            <td>
              <span class="badge badge-${r.status === "SUCCESS" ? "success" : "failed"}">
                <span class="dot dot-${r.status === "SUCCESS" ? "success" : "failed"}"></span>
                ${r.status === "SUCCESS" ? "Success" : "Failed"}
              </span>
              ${r.reason ? `<div class="reason">${r.reason}</div>` : ""}
            </td>
            <td class="${r.status === "SUCCESS" ? "amount-success" : "amount-failed"}">₹${r.amount.toLocaleString("en-IN")}</td>
            <td>${r.user}</td>
            <td>${r.merchant}</td>
            <td class="mono">${r.txId}</td>
          </tr>
        `).join("")
      }
    </tbody>
  </table>

  <!-- Footer -->
  <div class="footer">
    <span>Tapfinity · Confidential · For internal use only</span>
    <span>Generated by admin on ${generatedAt}</span>
  </div>

</div>

<script>
  // Auto-trigger print dialog after page loads
  window.addEventListener("load", () => {
    setTimeout(() => window.print(), 600);
  });
</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
