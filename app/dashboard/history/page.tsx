"use client";

import { useEffect, useState, useCallback } from "react";
import UserShell from "../UserShell";
import Link from "next/link";

type Tx = {
  id: string; amount: number; type: "CREDIT" | "DEBIT";
  status: string; createdAt: string; merchant: string;
};

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/5">
      <div className="flex items-center gap-3">
        <div className="skeleton w-9 h-9 rounded-lg" />
        <div className="space-y-1.5">
          <div className="skeleton h-3.5 w-28 rounded" />
          <div className="skeleton h-3 w-20 rounded" />
        </div>
      </div>
      <div className="skeleton h-4 w-16 rounded" />
    </div>
  );
}

export default function HistoryPage() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "DEBIT" | "CREDIT">("ALL");

  const load = useCallback(async (cursor?: string) => {
    const url = cursor
      ? `/api/user/transactions?cursor=${cursor}`
      : "/api/user/transactions";
    const data = await fetch(url).then(r => r.json());
    return { txs: data.transactions ?? [], nextCursor: data.nextCursor ?? null };
  }, []);

  useEffect(() => {
    load().then(({ txs, nextCursor }) => {
      setTxs(txs); setNextCursor(nextCursor); setLoading(false);
    });
  }, [load]);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    const { txs: more, nextCursor: nc } = await load(nextCursor);
    setTxs(prev => [...prev, ...more]);
    setNextCursor(nc);
    setLoadingMore(false);
  }

  const filtered = filter === "ALL" ? txs : txs.filter(t => t.type === filter);
  const totalSpent  = txs.filter(t => t.type === "DEBIT").reduce((s, t) => s + t.amount, 0);
  const totalCredit = txs.filter(t => t.type === "CREDIT").reduce((s, t) => s + t.amount, 0);

  return (
    <UserShell>
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-lg">≡</div>
          <div>
            <h1 className="text-xl font-bold text-white">Transaction History</h1>
            <p className="text-xs text-gray-500">{!loading && `${txs.length} loaded`}</p>
          </div>
        </div>

        {/* Summary strip */}
        {!loading && txs.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#080f20] border border-white/8 px-4 py-3">
              <p className="text-xs text-gray-500 mb-0.5">Total spent</p>
              <p className="text-lg font-black text-red-400">−₹{totalSpent.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-xl bg-[#080f20] border border-white/8 px-4 py-3">
              <p className="text-xs text-gray-500 mb-0.5">Total received</p>
              <p className="text-lg font-black text-emerald-400">+₹{totalCredit.toLocaleString("en-IN")}</p>
            </div>
          </div>
        )}

        {/* Filter pills */}
        <div className="flex gap-2">
          {(["ALL", "DEBIT", "CREDIT"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold border transition ${
                filter === f
                  ? "bg-orange-500/15 border-orange-500/30 text-orange-300"
                  : "bg-white/3 border-white/8 text-gray-500 hover:text-white"
              }`}>
              {f}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="rounded-2xl border border-white/8 bg-[#080f20] overflow-hidden">
          {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}

          {!loading && filtered.length === 0 && (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center mx-auto mb-3"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-600"><path d="M22 12h-6l-2 3H10l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg></div>
              <p className="text-gray-500 text-sm">No transactions</p>
            </div>
          )}

          {!loading && filtered.map(tx => (
            <Link key={tx.id} href={`/dashboard/history/${tx.id}`}
              className="flex items-center justify-between px-4 py-3.5 border-b border-white/5 last:border-0 hover:bg-white/3 transition group">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                  tx.type === "CREDIT" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                }`}>
                  {tx.type === "CREDIT" ? "↑" : "↓"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate">{tx.merchant}</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {new Date(tx.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-sm font-bold ${tx.type === "CREDIT" ? "text-emerald-400" : "text-white"}`}>
                  {tx.type === "CREDIT" ? "+" : "−"}₹{tx.amount.toLocaleString("en-IN")}
                </span>
                <span className="text-gray-700 group-hover:text-gray-400 transition text-xs">›</span>
              </div>
            </Link>
          ))}
        </div>

        {nextCursor && (
          <button onClick={loadMore} disabled={loadingMore}
            className="w-full rounded-xl border border-white/10 py-3 text-sm text-gray-500 hover:text-white hover:bg-white/5 transition disabled:opacity-50">
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        )}
      </div>
    </UserShell>
  );
}
