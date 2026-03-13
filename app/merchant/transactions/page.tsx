"use client";

import { useEffect, useState } from "react";

type Tx = { id: string; amount: number; status: string; createdAt: string; };

function SkeletonRow() {
  return (
    <tr className="border-t border-white/5">
      {[1, 2, 3].map(i => (
        <td key={i} className="px-4 py-3.5">
          <div className="skeleton h-4 rounded-md" style={{ width: `${50 + i * 15}%` }} />
        </td>
      ))}
    </tr>
  );
}

export default function MerchantTransactions() {
  const [txs, setTxs]       = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    fetch("/api/merchant/transactions")
      .then(r => r.json())
      .then(data => { setTxs(data.transactions || []); setLoading(false); })
      .catch(() => { setError("Failed to load transactions."); setLoading(false); });
  }, []);

  const successTxs = txs.filter(t => t.status === "SUCCESS");
  const total = successTxs.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Transactions</h1>
        {!loading && !error && (
          <p className="text-xs text-gray-500 mt-0.5">
            {successTxs.length} successful · ₹{total.toLocaleString("en-IN")} total received
          </p>
        )}
      </div>

      {/* Summary strip */}
      {!loading && txs.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Received", value: `₹${total.toLocaleString("en-IN")}`, accent: "border-violet-500/20" },
            { label: "Payments",       value: successTxs.length,                   accent: "border-white/8" },
            { label: "Failed",         value: txs.length - successTxs.length,      accent: txs.length - successTxs.length > 0 ? "border-red-500/20" : "border-white/8" },
          ].map(({ label, value, accent }) => (
            <div key={label} className={`rounded-2xl border bg-[#080f20] p-4 ${accent}`}>
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className="text-xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-500/8 border border-red-500/20 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      <div className="rounded-2xl border border-white/8 bg-[#080f20] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Time</th>
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}

            {!loading && txs.length === 0 && (
              <tr>
                <td colSpan={3} className="py-16 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center mx-auto mb-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-600">
                      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No transactions yet</p>
                  <p className="text-gray-700 text-xs mt-1">Payments will appear here after your first transaction</p>
                </td>
              </tr>
            )}

            {!loading && txs.map(tx => (
              <tr key={tx.id} className="border-t border-white/5 hover:bg-white/3 transition-colors">
                <td className="px-4 py-3.5 font-semibold text-white">₹{tx.amount.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                    tx.status === "SUCCESS"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${tx.status === "SUCCESS" ? "bg-emerald-400" : "bg-red-400"}`} />
                    {tx.status}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-gray-500 text-xs">
                  {new Date(tx.createdAt).toLocaleString("en-IN", {
                    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
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
