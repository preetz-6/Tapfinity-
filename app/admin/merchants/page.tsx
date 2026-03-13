"use client";

import { useEffect, useState } from "react";
import CreateMerchantModal from "./CreateMerchantModal";
import Link from "next/link";

type Merchant = { id: string; name: string; email: string; status: "ACTIVE" | "BLOCKED"; createdAt: string; };

function SkeletonRow() {
  return (
    <tr className="border-t border-white/5">
      {[1,2,3,4].map(i => (
        <td key={i} className="px-4 py-3.5">
          <div className="skeleton h-4 rounded-md" style={{ width: `${40 + i*15}%` }} />
        </td>
      ))}
    </tr>
  );
}

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  async function fetchMerchants() {
    const res = await fetch("/api/admin/merchants");
    const data = await res.json();
    setMerchants(data.merchants || []);
  }

  async function toggleStatus(m: Merchant) {
    await fetch("/api/admin/merchants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchantId: m.id, status: m.status === "ACTIVE" ? "BLOCKED" : "ACTIVE" }),
    });
    await fetchMerchants();
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/merchants");
        const data = await res.json();
        if (!cancelled) { setMerchants(data.merchants || []); setLoading(false); }
      } catch { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const activeCount = merchants.filter(m => m.status === "ACTIVE").length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Merchant Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">{merchants.length} total merchants</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition active:scale-95 shadow-lg shadow-blue-500/20">
          <span className="text-base leading-none">+</span>
          Create Merchant
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Total", value: merchants.length, color: "text-white" },
          { label: "Active", value: activeCount, color: "text-emerald-400" },
        ].map(s => (
          <div key={s.label} className="rounded-xl bg-white/3 border border-white/5 px-4 py-3">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-lg font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block rounded-2xl border border-white/8 overflow-hidden bg-[#080f20]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-white/3">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Merchant</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Joined</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({length:4}).map((_, i) => <SkeletonRow key={i} />)}
            {!loading && merchants.length === 0 && (
              <tr><td colSpan={4} className="py-16 text-center text-gray-500 text-sm">No merchants yet</td></tr>
            )}
            {!loading && merchants.map(m => (
              <tr key={m.id} className="border-t border-white/5 hover:bg-white/3 transition-colors">
                <td className="px-4 py-3.5">
                  <p className="font-medium text-white">{m.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{m.email}</p>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${m.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${m.status === "ACTIVE" ? "bg-emerald-400" : "bg-red-400"}`} />
                    {m.status}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-gray-500 text-xs">
                  {new Date(m.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleStatus(m)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${m.status === "ACTIVE" ? "bg-amber-500/15 text-amber-400 border-amber-500/20 hover:bg-amber-500/25" : "bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25"}`}>
                      {m.status === "ACTIVE" ? "Block" : "Unblock"}
                    </button>
                    <Link href={`/admin/merchants/${m.id}/transactions`}
                      className="rounded-lg border border-blue-500/20 bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 px-3 py-1.5 text-xs font-semibold transition">
                      Transactions
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-3">
        {loading && Array.from({length:3}).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/5 p-4 bg-[#080f20] space-y-3">
            <div className="skeleton h-4 w-1/2 rounded-md" />
            <div className="skeleton h-3 w-3/4 rounded-md" />
          </div>
        ))}
        {!loading && merchants.map(m => (
          <div key={m.id} className="rounded-2xl border border-white/8 bg-[#080f20] p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-white">{m.name}</p>
                <p className="text-xs text-gray-500">{m.email}</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${m.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${m.status === "ACTIVE" ? "bg-emerald-400" : "bg-red-400"}`} />
                {m.status}
              </span>
            </div>
            <div className="flex gap-2 pt-1 border-t border-white/5">
              <button onClick={() => toggleStatus(m)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${m.status === "ACTIVE" ? "bg-amber-500/15 text-amber-400 border-amber-500/20" : "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"}`}>
                {m.status === "ACTIVE" ? "Block" : "Unblock"}
              </button>
              <Link href={`/admin/merchants/${m.id}/transactions`}
                className="rounded-lg border border-blue-500/20 bg-blue-500/15 text-blue-400 px-3 py-1.5 text-xs font-semibold">
                Transactions
              </Link>
            </div>
          </div>
        ))}
      </div>

      {showCreate && <CreateMerchantModal onClose={() => setShowCreate(false)} onCreated={fetchMerchants} />}
    </div>
  );
}
