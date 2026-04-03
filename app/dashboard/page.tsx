"use client";

import { useEffect, useState } from "react";
import UserShell from "./UserShell";
import SpendChart from "./components/SpendChart";
import MerchantChart from "./components/MerchantChart";
import { ErrorBoundary } from "../components/ErrorBoundary";
import Link from "next/link";

type UserStatus = "ACTIVE" | "BLOCKED";
type UserTx = { id: string; amount: number; type: "DEBIT" | "CREDIT"; createdAt: string; };

function StatCard({ label, value, sub, accent, icon }: {
  label: string; value: string; sub?: string; accent: string; icon?: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl p-5 border ${accent} bg-[#080f20] flex items-start gap-3`}>
      {icon && (
        <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0 text-orange-400">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [balance, setBalance] = useState(0);
  const [status, setStatus] = useState<UserStatus>("ACTIVE");
  const [hasCard, setHasCard] = useState(false);
  const [spent30, setSpent30] = useState(0);
  const [spentToday, setSpentToday] = useState(0);
  const [dailyLimit, setDailyLimit] = useState<number | null>(null);
  const [name, setName] = useState("");
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
      setHasCard(me.hasCard ?? false);
      setName(me.name ?? "");
      setDailyLimit(me.dailySpendingLimit ?? null);

      const now = new Date();
      const startOf30 = new Date(now); startOf30.setDate(now.getDate() - 30);
      const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);

      const debits = txs.filter(tx => tx.type === "DEBIT");
      setSpent30(debits.filter(tx => new Date(tx.createdAt) >= startOf30).reduce((s, tx) => s + tx.amount, 0));
      setSpentToday(debits.filter(tx => new Date(tx.createdAt) >= startOfToday).reduce((s, tx) => s + tx.amount, 0));

      setLoading(false);
    }
    load();
  }, []);

  const limitPercent = dailyLimit ? Math.min((spentToday / dailyLimit) * 100, 100) : null;
  const limitWarning = limitPercent !== null && limitPercent >= 80;

  return (
    <UserShell>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-white">
            {name ? `Hello, ${name.split(" ")[0]}` : "Wallet Overview"}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Your Tapfinity balance and activity</p>
        </div>

        {/* Status alerts */}
        {!loading && status === "BLOCKED" && (
          <div className="rounded-xl bg-red-500/8 border border-red-500/20 px-4 py-3 flex items-center gap-3">
            <span className="text-red-400 text-sm font-bold">!</span>
            <p className="text-sm text-red-400">Your card is blocked. Contact your admin to re-enable payments.</p>
          </div>
        )}

        {!loading && !hasCard && (
          <div className="rounded-xl bg-amber-500/8 border border-amber-500/15 px-4 py-3 flex items-center gap-3">
            <span className="text-amber-400 text-sm font-bold">!</span>
            <p className="text-sm text-amber-300/80">No NFC card linked. Contact your admin to get a card provisioned.</p>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 12a2 2 0 0 1-4 0 2 2 0 0 1 4 0z"/></svg>}
              />
              <StatCard
                label="Card"
                value={hasCard ? status : "Not linked"}
                sub={
                  !hasCard ? "Contact admin" :
                  status === "ACTIVE" ? "Ready to tap" : "Contact admin"
                }
                accent={
                  !hasCard ? "border-white/8" :
                  status === "ACTIVE" ? "border-emerald-500/20" : "border-red-500/20"
                }
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>}
              />
              <StatCard
                label="Spent (30d)"
                value={`₹${spent30.toLocaleString("en-IN")}`}
                sub="Last 30 days"
                accent="border-white/8"
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
              />
            </>
          )}
        </div>

        {/* Daily limit progress — only if limit is set */}
        {!loading && dailyLimit !== null && (
          <div className={`rounded-2xl border p-5 ${limitWarning ? "border-amber-500/25 bg-amber-500/5" : "border-white/8 bg-[#080f20]"}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-white">Daily Limit</p>
              <span className={`text-xs font-semibold ${limitWarning ? "text-amber-400" : "text-gray-400"}`}>
                ₹{spentToday.toLocaleString("en-IN")} / ₹{dailyLimit.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="w-full h-2 bg-white/8 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  limitPercent! >= 100 ? "bg-red-500" :
                  limitPercent! >= 80 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${limitPercent}%` }}
              />
            </div>
            {limitPercent! >= 100 && (
              <p className="text-xs text-red-400 mt-2">Daily limit reached. Payments will be declined until tomorrow.</p>
            )}
            {limitWarning && limitPercent! < 100 && (
              <p className="text-xs text-amber-400 mt-2">
                ₹{(dailyLimit - spentToday).toLocaleString("en-IN")} remaining today.
              </p>
            )}
          </div>
        )}

        {/* Quick actions */}
        {!loading && (
          <div className="grid grid-cols-2 gap-3">
            <Link href="/dashboard/history"
              className="rounded-2xl border border-white/8 bg-[#080f20] p-4 hover:bg-white/5 transition group">
              <p className="text-sm font-semibold text-white">Transaction History</p>
              <p className="text-xs text-gray-500 mt-0.5">View all payments</p>
            </Link>
            <Link href="/dashboard/card"
              className="rounded-2xl border border-white/8 bg-[#080f20] p-4 hover:bg-white/5 transition group">
              <p className="text-sm font-semibold text-white">Card & Security</p>
              <p className="text-xs text-gray-500 mt-0.5">Block card, set limits</p>
            </Link>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-2xl bg-[#080f20] border border-white/8 p-5">
            <p className="text-sm font-semibold text-white mb-4">Spending Trend</p>
            <ErrorBoundary>
              <SpendChart />
            </ErrorBoundary>
          </div>
          <div className="rounded-2xl bg-[#080f20] border border-white/8 p-5">
            <p className="text-sm font-semibold text-white mb-4">Top Merchants</p>
            <ErrorBoundary>
              <MerchantChart />
            </ErrorBoundary>
          </div>
        </div>

      </div>
    </UserShell>
  );
}
