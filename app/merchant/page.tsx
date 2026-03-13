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

function StatCard({ label, value, sub, accent, icon }: { label: string; value: string; sub?: string; accent?: string; icon?: React.ReactNode }) {
  return (
    <div className={`rounded-2xl border bg-[#080f20] p-5 flex items-start gap-3 ${accent ?? "border-white/8"}`}>
      {icon && (
        <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0 text-violet-400">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
        <p className="text-2xl font-black text-white">{value}</p>
        {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
      </div>
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
              <StatCard label="Today" value={`₹${stats.today.revenue.toLocaleString("en-IN")}`} sub={`${stats.today.count} payments`} accent="border-violet-500/20"
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} />
              <StatCard label="This Week" value={`₹${stats.week.revenue.toLocaleString("en-IN")}`} sub={`${stats.week.count} payments`}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>} />
              <StatCard label="This Month" value={`₹${stats.month.revenue.toLocaleString("en-IN")}`} sub={`${stats.month.count} payments`}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} />
              <StatCard label="All Time" value={`${stats.total.count} txns`}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>} />
            </div>
          </div>

          {stats.failedToday > 0 && (
            <div className="rounded-xl bg-amber-500/8 border border-amber-500/15 px-4 py-3 flex items-center gap-3">
              <span className="text-xs font-bold text-amber-400">!</span>
              <p className="text-xs text-amber-400">
                <span className="font-bold">{stats.failedToday}</span> failed payment{stats.failedToday !== 1 ? "s" : ""} today
              </p>
            </div>
          )}
        </>
      )}

      <div className="flex flex-col items-center gap-4 py-4">
        <p className="text-sm text-gray-500">Tap to start a payment request</p>
        <Link href="/merchant/receive">
          <div className="relative flex items-center justify-center w-44 h-44 cursor-pointer group">
            <div className="absolute inset-0 rounded-full border-2 border-violet-500/15 animate-ping" style={{ animationDuration: "2.5s" }} />
            <div className="absolute inset-3 rounded-full border-2 border-violet-500/20 animate-ping" style={{ animationDuration: "2.5s", animationDelay: "0.4s" }} />
            <div className="absolute inset-6 rounded-full border-2 border-violet-500/25 animate-ping" style={{ animationDuration: "2.5s", animationDelay: "0.8s" }} />
            <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-violet-500/15 to-indigo-600/15 border-2 border-violet-500/35 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xl shadow-violet-500/15">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
          </div>
        </Link>
        <p className="text-lg font-bold text-white">Receive Payment</p>
      </div>

    </div>
  );
}
