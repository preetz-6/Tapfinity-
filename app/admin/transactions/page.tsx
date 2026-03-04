"use client";

import { useEffect, useState } from "react";

type Transaction = {
  id: string; amount: number; type: "CREDIT" | "DEBIT";
  status: "SUCCESS" | "FAILED" | "QUEUED"; createdAt: string;
  user: { email: string };
  admin?: { email: string; name: string } | null;
};

function SkeletonRow() {
  return (
    <tr className="border-t border-white/5">
      {[1,2,3,4,5,6].map(i => (
        <td key={i} className="px-4 py-3.5">
          <div className="skeleton h-4 rounded-md" style={{ width: `${35+i*10}%` }} />
        </td>
      ))}
    </tr>
  );
}

const STATUS_STYLE = {
  SUCCESS: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  FAILED: "bg-red-500/10 text-red-400 border-red-500/20",
  QUEUED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL"|"CREDIT"|"DEBIT">("ALL");

  useEffect(() => {
    fetch("/api/transactions")
      .then(r => r.json())
      .then(d => { setTransactions(d.transactions || []); setLoading(false); });
  }, []);

  const filtered = filter === "ALL" ? transactions : transactions.filter(t => t.type === filter);
  const totalVol = transactions.filter(t => t.status === "SUCCESS").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Transactions</h1>
          <p className="text-xs text-gray-500 mt-0.5">₹{totalVol.toLocaleString("en-IN")} total volume</p>
        </div>
        {/* Filter pills */}
        <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/5 w-fit">
          {(["ALL","CREDIT","DEBIT"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filter === f ? "bg-white/15 text-white" : "text-gray-500 hover:text-gray-300"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block rounded-2xl border border-white/8 overflow-hidden bg-[#080f20]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-white/3">
              {["User","Type","Amount","Status","Source","Time"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({length:6}).map((_, i) => <SkeletonRow key={i} />)}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} className="py-16 text-center text-gray-500 text-sm">No transactions yet</td></tr>
            )}
            {!loading && filtered.map(tx => (
              <tr key={tx.id} className="border-t border-white/5 hover:bg-white/3 transition-colors">
                <td className="px-4 py-3.5 text-gray-300 text-xs">{tx.user?.email}</td>
                <td className="px-4 py-3.5">
                  <span className={`font-semibold text-xs ${tx.type === "CREDIT" ? "text-emerald-400" : "text-red-400"}`}>
                    {tx.type === "CREDIT" ? "↑" : "↓"} {tx.type}
                  </span>
                </td>
                <td className="px-4 py-3.5 font-semibold text-white">₹{tx.amount.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLE[tx.status]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${tx.status === "SUCCESS" ? "bg-emerald-400" : tx.status === "FAILED" ? "bg-red-400" : "bg-amber-400"}`} />
                    {tx.status}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`text-xs font-medium ${tx.admin ? "text-blue-400" : "text-gray-500"}`}>
                    {tx.admin ? "Admin" : "Device"}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                  {new Date(tx.createdAt).toLocaleString("en-IN", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-3">
        {loading && Array.from({length:4}).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/5 p-4 bg-[#080f20]">
            <div className="skeleton h-4 w-1/2 rounded-md mb-2" />
            <div className="skeleton h-3 w-3/4 rounded-md" />
          </div>
        ))}
        {!loading && filtered.map(tx => (
          <div key={tx.id} className="rounded-2xl border border-white/8 bg-[#080f20] p-4 space-y-2.5">
            <div className="flex justify-between items-start">
              <p className="text-xs text-gray-500">{tx.user?.email}</p>
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLE[tx.status]}`}>
                {tx.status}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`font-bold text-lg ${tx.type === "CREDIT" ? "text-emerald-400" : "text-red-400"}`}>
                {tx.type === "CREDIT" ? "+" : "−"}₹{tx.amount.toLocaleString("en-IN")}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(tx.createdAt).toLocaleString("en-IN", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
