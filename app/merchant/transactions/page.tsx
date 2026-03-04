"use client";

import { useEffect, useState } from "react";

type Tx = { id: string; amount: number; status: string; createdAt: string; };

function SkeletonRow() {
  return (
    <tr className="border-t border-white/5">
      {[1, 2, 3].map(i => (
        <td key={i} className="p-4">
          <div className="skeleton h-4 rounded-md" style={{ width: `${50 + i * 20}%` }} />
        </td>
      ))}
    </tr>
  );
}

export default function MerchantTransactions() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/merchant/transactions")
      .then(r => r.json())
      .then(data => { setTxs(data.transactions || []); setLoading(false); });
  }, []);

  const total = txs.filter(t => t.status === "SUCCESS").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <span className="text-lg">≡</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Transactions</h1>
          {!loading && <p className="text-xs text-gray-500">₹{total.toLocaleString("en-IN")} total received</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0a0d18] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}

            {!loading && txs.length === 0 && (
              <tr>
                <td colSpan={3} className="py-16 text-center">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-gray-500 text-sm">No transactions yet</p>
                </td>
              </tr>
            )}

            {!loading && txs.map(tx => (
              <tr key={tx.id} className="border-t border-white/5 hover:bg-white/3 transition-colors">
                <td className="px-4 py-3.5 font-semibold text-white">₹{tx.amount.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                    tx.status === "SUCCESS"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
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
