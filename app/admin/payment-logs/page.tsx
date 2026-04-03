"use client";

import { Fragment, useEffect, useState, useCallback } from "react";

type Merchant = { id: string; name: string; email: string };
type LogEntry = {
  id: string;
  amount: number;
  status: "SUCCESS" | "FAILED";
  failureReason: string | null;
  ipAddress: string | null;
  createdAt: string;
  merchant: { id: string; name: string; email: string };
  user: { id: string; name: string; email: string } | null;
  paymentRequestId: string | null;
};

function SkeletonRow() {
  return (
    <tr className="border-t border-white/5">
      {[1,2,3,4,5].map(i => (
        <td key={i} className="px-4 py-3.5">
          <div className="skeleton h-4 rounded-md" style={{ width: `${40 + i * 10}%` }} />
        </td>
      ))}
    </tr>
  );
}

const FAILURE_LABELS: Record<string, string> = {
  INSUFFICIENT_BALANCE:      "Insufficient Balance",
  CARD_NOT_PROVISIONED:      "Card Not Provisioned",
  USER_BLOCKED:              "User Blocked",
  REQUEST_ALREADY_PROCESSED: "Already Processed",
  DAILY_LIMIT_EXCEEDED:      "Daily Limit Exceeded",
};

export default function PaymentLogsPage() {
  const [logs, setLogs]           = useState<LogEntry[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading]     = useState(true);
  const [status, setStatus]       = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [page, setPage]           = useState(1);
  const [total, setTotal]         = useState(0);
  const [pages, setPages]         = useState(1);
  const [expanded, setExpanded]   = useState<string | null>(null);

  // Summary counts
  const successCount = logs.filter(l => l.status === "SUCCESS").length;
  const failedCount  = logs.filter(l => l.status === "FAILED").length;
  const totalAmount  = logs.filter(l => l.status === "SUCCESS").reduce((s, l) => s + l.amount, 0);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (status)     params.append("status", status);
    if (merchantId) params.append("merchantId", merchantId);
    const res  = await fetch(`/api/admin/payment-logs?${params}`);
    const data = await res.json();
    setLogs(data.logs || []);
    setTotal(data.total || 0);
    setPages(data.pages || 1);
    setLoading(false);
  }, [page, status, merchantId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch("/api/admin/merchants")
      .then(r => r.json())
      .then(d => setMerchants(d.merchants || []));
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [status, merchantId]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Payment Logs</h1>
          <p className="text-xs text-gray-500 mt-0.5">{total.toLocaleString("en-IN")} total attempts recorded</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white hover:bg-white/10 transition w-fit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          Refresh
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Successful",
            value: successCount,
            sub: `₹${totalAmount.toLocaleString("en-IN")} collected`,
            accent: "border-emerald-500/20 bg-emerald-500/5",
            dot: "bg-emerald-400",
            text: "text-emerald-400",
          },
          {
            label: "Failed",
            value: failedCount,
            sub: "this page",
            accent: "border-red-500/20 bg-red-500/5",
            dot: "bg-red-400",
            text: "text-red-400",
          },
          {
            label: "Total shown",
            value: logs.length,
            sub: `of ${total} total`,
            accent: "border-white/8 bg-[#080f20]",
            dot: "bg-gray-400",
            text: "text-white",
          },
        ].map(c => (
          <div key={c.label} className={`rounded-2xl border p-4 flex items-center gap-3 ${c.accent}`}>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium">{c.label}</p>
              <p className={`text-xl font-black ${c.text}`}>{c.value}</p>
              <p className="text-xs text-gray-600 truncate">{c.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Status filter */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/5">
          {(["", "SUCCESS", "FAILED"] as const).map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                status === s
                  ? s === "SUCCESS" ? "bg-emerald-500/20 text-emerald-300"
                  : s === "FAILED"  ? "bg-red-500/20 text-red-300"
                  : "bg-white/15 text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}>
              {s === "" ? "All" : s === "SUCCESS" ? "Success" : "Failed"}
            </button>
          ))}
        </div>

        {/* Merchant filter */}
        <select value={merchantId} onChange={e => setMerchantId(e.target.value)}
          className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition">
          <option value="">All Merchants</option>
          {merchants.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>

        {(status || merchantId) && (
          <button onClick={() => { setStatus(""); setMerchantId(""); }}
            className="text-xs text-gray-500 hover:text-white transition underline underline-offset-2">
            Clear filters
          </button>
        )}
      </div>

      {/* Table — desktop */}
      <div className="hidden sm:block rounded-2xl border border-white/8 overflow-hidden bg-[#080f20]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-white/3">
              {["Status", "Amount", "User", "Merchant", "Time"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan={5} className="py-20 text-center text-gray-500 text-sm">
                  No payment logs found
                </td>
              </tr>
            )}
            {!loading && logs.map(log => (
              <Fragment key={log.id}>
                <tr
                  onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                  className="border-t border-white/5 hover:bg-white/3 transition-colors cursor-pointer"
                >
                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border w-fit ${
                        log.status === "SUCCESS"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${log.status === "SUCCESS" ? "bg-emerald-400" : "bg-red-400"}`} />
                        {log.status === "SUCCESS" ? "Success" : "Failed"}
                      </span>
                      {log.status === "FAILED" && log.failureReason && (
                        <span className="text-xs text-red-400/60 font-mono pl-0.5">
                          {FAILURE_LABELS[log.failureReason] ?? log.failureReason}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-3.5">
                    <span className={`font-bold ${log.status === "SUCCESS" ? "text-white" : "text-gray-500 line-through"}`}>
                      ₹{log.amount.toLocaleString("en-IN")}
                    </span>
                  </td>

                  {/* User */}
                  <td className="px-4 py-3.5">
                    {log.user ? (
                      <div>
                        <p className="text-xs text-white font-medium">{log.user.name}</p>
                        <p className="text-xs text-gray-500">{log.user.email}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-600 italic">Unknown card</span>
                    )}
                  </td>

                  {/* Merchant */}
                  <td className="px-4 py-3.5">
                    <div>
                      <p className="text-xs text-white font-medium">{log.merchant.name}</p>
                      <p className="text-xs text-gray-500">{log.merchant.email}</p>
                    </div>
                  </td>

                  {/* Time */}
                  <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("en-IN", {
                      day: "numeric", month: "short",
                      hour: "2-digit", minute: "2-digit",
                    })}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      className={`inline ml-2 transition-transform ${expanded === log.id ? "rotate-180" : ""} text-gray-600`}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </td>
                </tr>

                {/* Expanded detail row */}
                {expanded === log.id && (
                  <tr key={`${log.id}-detail`} className="border-t border-white/5 bg-white/2">
                    <td colSpan={5} className="px-4 py-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div>
                          <p className="text-gray-600 mb-1">Log ID</p>
                          <p className="text-gray-400 font-mono break-all">{log.id}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-1">Request ID</p>
                          <p className="text-gray-400 font-mono break-all">{log.paymentRequestId ?? "—"}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-1">IP Address</p>
                          <p className="text-gray-400 font-mono">{log.ipAddress ?? "—"}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-1">Failure reason</p>
                          <p className={`font-mono ${log.failureReason ? "text-red-400" : "text-gray-600"}`}>
                            {log.failureReason ?? "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {loading && Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/5 p-4 bg-[#080f20] space-y-2">
            <div className="skeleton h-4 w-1/3 rounded-md" />
            <div className="skeleton h-3 w-2/3 rounded-md" />
          </div>
        ))}
        {!loading && logs.map(log => (
          <div key={log.id}
            onClick={() => setExpanded(expanded === log.id ? null : log.id)}
            className="rounded-2xl border border-white/8 bg-[#080f20] p-4 space-y-3 cursor-pointer active:scale-[0.99] transition-transform">
            <div className="flex items-start justify-between gap-2">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                log.status === "SUCCESS"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border-red-500/20"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${log.status === "SUCCESS" ? "bg-emerald-400" : "bg-red-400"}`} />
                {log.status === "SUCCESS" ? "Success" : "Failed"}
              </span>
              <span className={`text-lg font-black ${log.status === "SUCCESS" ? "text-white" : "text-gray-600 line-through"}`}>
                ₹{log.amount.toLocaleString("en-IN")}
              </span>
            </div>
            {log.status === "FAILED" && log.failureReason && (
              <p className="text-xs text-red-400/70">{FAILURE_LABELS[log.failureReason] ?? log.failureReason}</p>
            )}
            <div className="flex justify-between text-xs text-gray-500">
              <span>{log.user?.name ?? "Unknown card"}</span>
              <span>{log.merchant.name}</span>
            </div>
            <p className="text-xs text-gray-600">
              {new Date(log.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </p>
            {expanded === log.id && (
              <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray-600 mb-0.5">IP Address</p>
                  <p className="text-gray-400 font-mono">{log.ipAddress ?? "—"}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-0.5">Failure</p>
                  <p className="text-red-400 font-mono">{log.failureReason ?? "—"}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-600">
            Page {page} of {pages} · {total} total records
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-gray-400 hover:text-white transition disabled:opacity-30">
              ← Prev
            </button>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              className="px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-gray-400 hover:text-white transition disabled:opacity-30">
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
