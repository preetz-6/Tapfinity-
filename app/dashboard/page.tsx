"use client";

import { useEffect, useState } from "react";
import UserShell from "./UserShell";
import SpendChart from "./components/SpendChart";
import MerchantChart from "./components/MerchantChart";

type UserStatus = "ACTIVE" | "BLOCKED";
type UserTx = { id: string; amount: number; type: "DEBIT" | "CREDIT"; createdAt: string; };

function StatCard({
  label, value, sub, accent, icon
}: {
  label: string; value: string; sub?: string;
  accent: string; icon: string;
}) {
  return (
    <div className={`rounded-2xl p-5 border ${accent} bg-gradient-to-br from-white/3 to-transparent`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">{label}</p>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [balance, setBalance] = useState(0);
  const [status, setStatus] = useState<UserStatus>("ACTIVE");
  const [spent30, setSpent30] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [meRes, txRes] = await Promise.all([
        fetch("/api/user/me", { cache: "no-store" }),
        fetch("/api/user/transactions", { cache: "no-store" }),
      ]);
      const me = await meRes.json();
      const txData = await txRes.json();
      const txs: UserTx[] = txData.transactions ?? [];

      setBalance(me.balance);
      setStatus(me.status);

      const last30 = new Date();
      last30.setDate(last30.getDate() - 30);
      const spent = txs
        .filter(tx => tx.type === "DEBIT" && new Date(tx.createdAt) >= last30)
        .reduce((sum, tx) => sum + tx.amount, 0);
      setSpent30(spent);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <UserShell>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-7">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <span className="text-lg">◈</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Wallet Overview</h1>
            <p className="text-xs text-gray-500">Your Tapfinity balance & activity</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/5 p-5 h-24 skeleton" />
            ))
          ) : (
            <>
              <StatCard
                label="Balance"
                value={`₹${balance.toLocaleString("en-IN")}`}
                sub="Available to spend"
                accent="border-orange-500/20"
                icon="💰"
              />
              <StatCard
                label="Card Status"
                value={status}
                sub={status === "ACTIVE" ? "Ready to tap" : "Contact admin"}
                accent={status === "ACTIVE" ? "border-emerald-500/20" : "border-red-500/20"}
                icon={status === "ACTIVE" ? "✓" : "✕"}
              />
              <StatCard
                label="Spent (30d)"
                value={`₹${spent30.toLocaleString("en-IN")}`}
                sub="Last 30 days"
                accent="border-white/10"
                icon="📊"
              />
            </>
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-2xl bg-[#0d0a07] border border-white/5 p-5">
            <p className="text-sm font-semibold text-gray-300 mb-4">Spending Trend</p>
            <SpendChart />
          </div>
          <div className="rounded-2xl bg-[#0d0a07] border border-white/5 p-5">
            <p className="text-sm font-semibold text-gray-300 mb-4">Top Merchants</p>
            <MerchantChart />
          </div>
        </div>
      </div>
    </UserShell>
  );
}
