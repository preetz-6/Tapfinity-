"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Stats = {
  today:  { revenue: number; count: number };
  week:   { revenue: number; count: number };
  month:  { revenue: number; count: number };
  total:  { count: number };
  failedToday: number;
};

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className={`rounded-2xl border bg-[#080f20] p-5 ${accent ?? "border-white/8"}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-black text-white mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function MerchantHome() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/merchant/stats")
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-lg mx-auto space-y-7">

      {/* Stats */}
      {loading && (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      )}

      {!loading && stats && (
        <>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-semibold">Revenue</p>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Today"      value={`₹${stats.today.revenue.toLocaleString("en-IN")}`}  sub={`${stats.today.count} payments`}  accent="border-violet-500/20" />
              <StatCard label="This week"  value={`₹${stats.week.revenue.toLocaleString("en-IN")}`}   sub={`${stats.week.count} payments`} />
              <StatCard label="This month" value={`₹${stats.month.revenue.toLocaleString("en-IN")}`}  sub={`${stats.month.count} payments`} />
              <StatCard label="All time"   value={`${stats.total.count} txns`} />
            </div>
          </div>

          {stats.failedToday > 0 && (
            <div className="rounded-xl bg-amber-500/8 border border-amber-500/15 px-4 py-3 flex items-center gap-3">
              <span className="text-amber-400">⚠</span>
              <p className="text-xs text-amber-400">
                <span className="font-bold">{stats.failedToday}</span> failed payment{stats.failedToday !== 1 ? "s" : ""} today
              </p>
            </div>
          )}
        </>
      )}

      {/* Receive button */}
      <div className="flex flex-col items-center gap-5 py-4">
        <p className="text-sm text-gray-500">Tap to start a payment request</p>
        <Link href="/merchant/receive">
          <div className="relative flex items-center justify-center w-44 h-44 cursor-pointer group">
            <div className="absolute inset-0 rounded-full border-2 border-violet-500/20 animate-ping" style={{ animationDuration: "2.5s" }} />
            <div className="absolute inset-3 rounded-full border-2 border-violet-500/25 animate-ping" style={{ animationDuration: "2.5s", animationDelay: "0.4s" }} />
            <div className="absolute inset-6 rounded-full border-2 border-violet-500/30 animate-ping" style={{ animationDuration: "2.5s", animationDelay: "0.8s" }} />
            <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-600/20 border-2 border-violet-500/40 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xl shadow-violet-500/20">
              <span className="text-5xl">⚡</span>
            </div>
          </div>
        </Link>
        <p className="text-lg font-bold text-white">Receive Payment</p>
      </div>

    </div>
  );
}
