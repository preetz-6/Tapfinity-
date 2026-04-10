"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Tx = {
  id: string; amount: number; status: string; createdAt: string;
  user: { name: string; email: string } | null;
};
type Merchant = { id: string; name: string; email: string };

function SkeletonRow() {
  return (
    <tr className="border-t border-white/5">
      {[1,2,3,4].map(i => (
        <td key={i} className="px-4 py-3.5">
          <div className="skeleton h-4 rounded-md" style={{ width: `${40 + i * 12}%` }} />
        </td>
      ))}
    </tr>
  );
}

export default function MerchantTransactionsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [merchant, setMerchant]       = useState<Merchant | null>(null);
  const [txs, setTxs]                 = useState<Tx[]>([]);
  const [totalRevenue, setRevenue]    = useState(0);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");

  useEffect(() => {
    fetch(`/api/admin/merchants/${id}/transactions`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setMerchant(d.merchant);
        setTxs(d.transactions || []);
        setRevenue(d.totalRevenue || 0);
      })
      .catch(() => setError("Failed to load transactions"))
      .finally(() => setLoading(false));
  }, [id]);

  const successCount = txs.filter(t => t.status === "SUCCESS").length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.back()}
          className="mt-1 p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">
            {merchant ? merchant.name : "Merchant"} — Transactions
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {merchant?.email ?? "Loading…"}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/8 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Summary */}
      {!loading && !error && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, accent: "border-violet-500/20 bg-violet-500/5", text: "text-violet-400" },
            { label: "Successful",    value: successCount,                                accent: "border-emerald-500/20 bg-emerald-500/5", text: "text-emerald-400" },
            { label: "Total",         value: txs.length,                                  accent: "border-white/8 bg-[#080f20]", text: "text-white" },
          ].map(c => (
            <div key={c.label} className={`rounded-2xl border p-4 ${c.accent}`}>
              <p className="text-xs text-gray-500 font-medium mb-1">{c.label}</p>
              <p className={`text-2xl font-black ${c.text}`}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-white/8 overflow-hidden bg-[#080f20]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-white/3">
              {["User", "Amount", "Status", "Time"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
            {!loading && txs.length === 0 && !error && (
              <tr>
                <td colSpan={4} className="py-16 text-center text-gray-500 text-sm">
                  No transactions yet for this merchant
                </td>
              </tr>
            )}
            {!loading && txs.map(tx => (
              <tr key={tx.id} className="border-t border-white/5 hover:bg-white/3 transition-colors">
                <td className="px-4 py-3.5">
                  {tx.user ? (
                    <div>
                      <p className="text-xs text-white font-medium">{tx.user.name}</p>
                      <p className="text-xs text-gray-500">{tx.user.email}</p>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-600 italic">Unknown</span>
                  )}
                </td>
                <td className="px-4 py-3.5 font-bold text-white">
                  ₹{tx.amount.toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    tx.status === "SUCCESS"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${tx.status === "SUCCESS" ? "bg-emerald-400" : "bg-red-400"}`} />
                    {tx.status === "SUCCESS" ? "Success" : "Failed"}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                  {new Date(tx.createdAt).toLocaleString("en-IN", {
                    day: "numeric", month: "short",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
