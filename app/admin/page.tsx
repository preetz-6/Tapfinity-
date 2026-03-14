"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const PIE_COLORS = ["#34d399", "#60a5fa", "#f472b6", "#a78bfa"];

type UserKpis = { total: number; active: number; blocked: number; totalBalance: number; };
type MerchantKpis = { total: number; active: number; blocked: number; };
type TxByDay = { day: string; count: number; };
type TxTypeSplit = { type: string; _count: { _all: number }; };
type RecentTx = { id: string; type: "CREDIT"|"DEBIT"; amount: number; user?: { email?: string }; createdAt: string; };
type RecentAction = { id: string; actionType: string; targetIdentifier: string; admin?: { name?: string }; createdAt: string; };
type FailedAttempt = { id: string; failureReason?: string; amount: number; createdAt: string; merchant?: { name?: string }; };
type DashboardData = {
  kpis: { users: UserKpis; merchants: MerchantKpis };
  txByDay: TxByDay[];
  txTypeSplit: TxTypeSplit[];
  recentTransactions: RecentTx[];
  recentActions: RecentAction[];
  failedAttempts: { total: number; breakdown: Record<string, number>; recent: FailedAttempt[] };
};

const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-[#0b1226] border border-white/10 px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-0.5">{label}</p>
      <p className="text-white font-bold">{payload[0].value} txns</p>
    </div>
  );
};

const KPI_ICONS: Record<string, React.ReactNode> = {
  users:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  active:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="20 6 9 17 4 12"/></svg>,
  blocked: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
  wallet:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 12a2 2 0 0 1-4 0 2 2 0 0 1 4 0z"/></svg>,
  store:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
};

const ICON_COLORS: Record<string, string> = {
  users:   "bg-blue-500/10 text-blue-400",
  active:  "bg-emerald-500/10 text-emerald-400",
  blocked: "bg-red-500/10 text-red-400",
  wallet:  "bg-violet-500/10 text-violet-400",
  store:   "bg-indigo-500/10 text-indigo-400",
};

function KpiCard({ label, value, sub, icon, accent }: { label: string; value: string|number; sub?: string; icon: string; accent: string }) {
  return (
    <div className={`rounded-2xl border bg-[#080f20] p-5 flex items-start gap-4 ${accent}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${ICON_COLORS[icon] ?? "bg-white/5 text-gray-400"}`}>
        {KPI_ICONS[icon] ?? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/></svg>}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-black text-white mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SkeletonCard() { return <div className="rounded-2xl border border-white/5 p-5 h-24 skeleton" />; }

const FAILURE_LABELS: Record<string, string> = {
  INSUFFICIENT_BALANCE: "Low balance",
  CARD_NOT_PROVISIONED: "No card",
  USER_BLOCKED: "Blocked",
  REQUEST_ALREADY_PROCESSED: "Duplicate",
  DAILY_LIMIT_EXCEEDED: "Limit hit",
  TIMEOUT: "Timeout",
};

export default function AdminDashboard() {
  const [data, setData]           = useState<DashboardData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing]   = useState(false);

  async function loadData(silent = false) {
    if (silent) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/dashboard");
      const d: DashboardData = await res.json();
      setData(d);
      setLastUpdated(new Date());
    } catch { /* keep stale data on error */ }
    finally { setLoading(false); setRefreshing(false); }
  }

  // Initial load
  useEffect(() => { loadData(); }, []);

  // Auto-refresh every 30 seconds silently
  useEffect(() => {
    const interval = setInterval(() => loadData(true), 30_000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({length: 8}).map((_,i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-white/5 h-72 skeleton" />
          <div className="rounded-2xl border border-white/5 h-72 skeleton" />
        </div>
      </div>
    );
  }

  const { kpis: { users, merchants }, txByDay, txTypeSplit, recentTransactions, recentActions, failedAttempts } = data;
  const pieData = txTypeSplit.map(t => ({ name: t.type, value: t._count._all }));
  const totalTx = txByDay.reduce((s, d) => s + d.count, 0);

  const chartData = txByDay.map(d => ({
    ...d,
    day: new Date(d.day + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
  }));

  return (
    <div className="space-y-7 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white">Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} · auto-refreshes every 30s`
              : "Live overview of the entire platform"}
          </p>
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/8 text-xs text-gray-400 hover:text-white hover:bg-white/10 transition disabled:opacity-50 flex-shrink-0"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={refreshing ? "animate-spin" : ""}>
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Failed attempts alert — show prominently if >0 */}
      {failedAttempts.total > 0 && (
        <div className="rounded-2xl border border-red-500/25 bg-red-500/5 px-5 py-4 flex flex-wrap items-start gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-red-400 text-xl flex-shrink-0">⚠</span>
            <div>
              <p className="text-sm font-bold text-red-400">
                {failedAttempts.total} failed payment attempt{failedAttempts.total !== 1 ? "s" : ""} in the last 24h
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Review the breakdown below for potential abuse</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(failedAttempts.breakdown).map(([reason, count]) => (
              <span key={reason} className="text-xs rounded-full bg-red-500/10 border border-red-500/20 text-red-400 px-2.5 py-1">
                {FAILURE_LABELS[reason] ?? reason}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* User KPIs */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-semibold">Users</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Total Users" value={users.total}   icon="users" accent="border-white/8" />
          <KpiCard label="Active" value={users.active}  sub="can transact" icon="active" accent="border-emerald-500/20" />
          <KpiCard label="Blocked" value={users.blocked} sub="restricted"   icon="blocked" accent="border-red-500/20" />
          <KpiCard label="Wallet Pool" value={`₹${users.totalBalance.toLocaleString("en-IN")}`} sub="total balance" icon="wallet" accent="border-blue-500/20" />
        </div>
      </div>

      {/* Merchant KPIs */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-semibold">Merchants</p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <KpiCard label="Total Merchants" value={merchants.total}   icon="store" accent="border-white/8" />
          <KpiCard label="Active" value={merchants.active}  sub="accepting payments" icon="active" accent="border-emerald-500/20" />
          <KpiCard label="Blocked" value={merchants.blocked} sub="suspended"           icon="blocked" accent="border-red-500/20" />
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl border border-white/8 bg-[#080f20] p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="font-bold text-white">Transaction Volume</p>
              <p className="text-xs text-gray-500 mt-0.5">{totalTx} transactions in last 7 days</p>
            </div>
            <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">Last 7 days</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#60a5fa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#374151" tick={{ fill: "#6b7280", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis stroke="#374151" tick={{ fill: "#6b7280", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#60a5fa" strokeWidth={2} fill="url(#txGrad)"
                dot={{ fill: "#60a5fa", strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: "#60a5fa" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#080f20] p-6">
          <p className="font-bold text-white mb-1">Credit vs Debit</p>
          <p className="text-xs text-gray-500 mb-3">All-time split</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={72} paddingAngle={4} strokeWidth={0}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-xs text-gray-400">{v}</span>} />
              <Tooltip
                formatter={(v: number | undefined) => [v ?? 0, "transactions"]}
                contentStyle={{ background: "#0b1226", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar chart */}
      <div className="rounded-2xl border border-white/8 bg-[#080f20] p-6">
        <p className="font-bold text-white mb-1">Daily Breakdown</p>
        <p className="text-xs text-gray-500 mb-5">Transaction count per day</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} margin={{ top: 0, right: 5, left: -20, bottom: 0 }} barSize={28}>
            <XAxis dataKey="day" stroke="#374151" tick={{ fill: "#6b7280", fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis stroke="#374151" tick={{ fill: "#6b7280", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar dataKey="count" radius={[6,6,0,0]}>
              {chartData.map((_, i) => <Cell key={i} fill={`hsl(${230 + i * 8}, 70%, ${50 + i * 3}%)`} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent activity + failed attempts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Recent Transactions */}
        <div className="rounded-2xl border border-white/8 bg-[#080f20] p-6">
          <p className="font-bold text-white mb-4">Recent Transactions</p>
          <div className="space-y-0">
            {recentTransactions.length === 0 && <p className="text-sm text-gray-500">No transactions yet</p>}
            {recentTransactions.slice(0, 6).map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0 ${tx.type === "CREDIT" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                    {tx.type === "CREDIT" ? "↑" : "↓"}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{tx.user?.email ?? "—"}</p>
                </div>
                <span className={`text-sm font-bold flex-shrink-0 ${tx.type === "CREDIT" ? "text-emerald-400" : "text-red-400"}`}>
                  {tx.type === "CREDIT" ? "+" : "−"}₹{tx.amount}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Admin Actions */}
        <div className="rounded-2xl border border-white/8 bg-[#080f20] p-6">
          <p className="font-bold text-white mb-4">Admin Actions</p>
          <div className="space-y-0">
            {recentActions.length === 0 && <p className="text-sm text-gray-500">No actions yet</p>}
            {recentActions.slice(0, 6).map(a => (
              <div key={a.id} className="flex items-start gap-2.5 py-2.5 border-b border-white/5 last:border-0">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white leading-tight">{a.actionType.replace(/_/g, " ")}</p>
                  <p className="text-xs text-gray-600 truncate mt-0.5">{a.targetIdentifier}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Failed attempts panel */}
        <div className="rounded-2xl border border-white/8 bg-[#080f20] p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-white">Failed Attempts</p>
            <span className="text-xs text-gray-600">last 24h</span>
          </div>
          {failedAttempts.total === 0 ? (
            <div className="text-center py-6">
              <p className="text-2xl mb-1">✓</p>
              <p className="text-xs text-gray-500">No failures today</p>
            </div>
          ) : (
            <div className="space-y-0">
              {failedAttempts.recent.slice(0, 6).map(a => (
                <div key={a.id} className="flex items-start justify-between py-2.5 border-b border-white/5 last:border-0 gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-red-400 leading-tight">
                      {FAILURE_LABELS[a.failureReason ?? ""] ?? a.failureReason ?? "Unknown"}
                    </p>
                    <p className="text-xs text-gray-600 truncate mt-0.5">{a.merchant?.name ?? "—"}</p>
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">₹{a.amount}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
