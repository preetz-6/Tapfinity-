"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import UserShell from "../../UserShell";
import Link from "next/link";

type TxDetail = {
  id: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  status: string;
  createdAt: string;
  clientTxId: string;
  merchant: string;
  merchantId: string | null;
};

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tx, setTx] = useState<TxDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch("/api/user/transactions")
      .then(r => r.json())
      .then(data => {
        const found = (data.transactions ?? []).find((t: TxDetail) => t.id === id);
        if (found) setTx(found);
        else setNotFound(true);
        setLoading(false);
      });
  }, [id]);

  return (
    <UserShell>
      <div className="max-w-md mx-auto">
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition mb-6">
          ← Back to history
        </button>

        {loading && (
          <div className="space-y-4">
            <div className="skeleton h-48 rounded-2xl" />
            <div className="skeleton h-32 rounded-2xl" />
          </div>
        )}

        {notFound && (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-gray-400">Transaction not found</p>
            <Link href="/dashboard/history" className="text-blue-400 text-sm mt-3 block">
              Back to history
            </Link>
          </div>
        )}

        {tx && (
          <div className="space-y-4">
            {/* Amount card */}
            <div className={`rounded-2xl border p-8 text-center ${
              tx.type === "CREDIT"
                ? "bg-emerald-500/5 border-emerald-500/20"
                : "bg-[#0d0508] border-red-500/15"
            }`}>
              <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl ${
                tx.type === "CREDIT"
                  ? "bg-emerald-500/15 border-2 border-emerald-500/30"
                  : "bg-red-500/10 border-2 border-red-500/20"
              }`}>
                {tx.type === "CREDIT" ? "↑" : "↓"}
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
                {tx.type === "CREDIT" ? "Money received" : "Payment made"}
              </p>
              <p className={`text-5xl font-black mt-1 ${
                tx.type === "CREDIT" ? "text-emerald-400" : "text-white"
              }`}>
                {tx.type === "CREDIT" ? "+" : "−"}₹{tx.amount.toLocaleString("en-IN")}
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border bg-white/5 border-white/10 text-gray-400">
                <span className={`w-1.5 h-1.5 rounded-full ${tx.status === "SUCCESS" ? "bg-emerald-400" : "bg-red-400"}`} />
                {tx.status}
              </div>
            </div>

            {/* Details */}
            <div className="rounded-2xl border border-white/8 bg-[#080f20] divide-y divide-white/5">
              {[
                { label: "Date & time",   value: new Date(tx.createdAt).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" }) },
                { label: tx.type === "CREDIT" ? "From"  : "To", value: tx.merchant },
                { label: "Type",          value: tx.type },
                { label: "Reference ID",  value: tx.id, mono: true },
                { label: "Idempotency",   value: tx.clientTxId, mono: true },
              ].map(row => (
                <div key={row.label} className="flex items-start justify-between px-5 py-3.5 gap-4">
                  <p className="text-xs text-gray-500 flex-shrink-0 pt-0.5">{row.label}</p>
                  <p className={`text-sm text-white text-right break-all ${row.mono ? "font-mono text-xs text-gray-400" : "font-medium"}`}>
                    {row.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </UserShell>
  );
}
