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
    <div className={`rounded-2xl border bg-gradient-to-b from-white/[0.03] to-transparent p-5 flex items-start gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${accent ?? "border-white/[0.06] hover:border-white/[0.12] hover:shadow-black/20"}`}>
      {icon && (
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0 text-violet-400">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-semibold mb-1 tracking-wide">{label}</p>
        <p className="text-2xl font-black text-white tracking-tight leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-gray-500 mt-1">{sub}</p>}
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
    <div className="max-w-lg mx-auto space-y-8 py-2">

      {loading && (
        <div className="space-y-6">
          <div className="h-6 w-24 bg-white/5 rounded-md skeleton" />
          <div className="grid grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          </div>
        </div>
      )}

      {!loading && stats && (
        <>
          <div className="space-y-4">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Revenue Overview</p>
            <div className="grid grid-cols-2 gap-4">
              <StatCard 
                label="Today" 
                value={`₹${stats.today.revenue.toLocaleString("en-IN")}`} 
                sub={`${stats.today.count} payments`} 
                accent="border-violet-500/35 hover:border-violet-500/60 hover:shadow-violet-500/[0.05]"
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} 
              />
              <StatCard 
                label="This Week" 
                value={`₹${stats.week.revenue.toLocaleString("en-IN")}`} 
                sub={`${stats.week.count} payments`}
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>} 
              />
              <StatCard 
                label="This Month" 
                value={`₹${stats.month.revenue.toLocaleString("en-IN")}`} 
                sub={`${stats.month.count} payments`}
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} 
              />
              <StatCard 
                label="All Time" 
                value={`${stats.total.count} txns`}
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>} 
              />
            </div>
          </div>

          {stats.failedToday > 0 && (
            <div className="rounded-2xl bg-amber-500/5 border border-amber-500/15 px-4 py-3 flex.5 items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <span className="text-amber-400 text-sm">⚠</span>
              <p className="text-xs text-amber-400/90 font-medium">
                There are <span className="font-bold text-white">{stats.failedToday} failed payment attempts</span> today.
              </p>
            </div>
          )}
        </>
      )}

      {/* NFC Action Button Wrapper */}
      <div className="flex flex-col items-center gap-5 py-6 bg-gradient-to-b from-white/[0.01] to-white/[0.03] border border-white/[0.04] rounded-3xl p-8 shadow-xl shadow-black/20">
        <p className="text-sm text-gray-400 font-semibold tracking-wide">Ready to accept payment?</p>
        <Link href="/merchant/receive" className="group">
          <div className="relative flex items-center justify-center w-48 h-48 cursor-pointer">
            {/* Pulsing rings */}
            <div className="absolute inset-0 rounded-full border border-violet-500/10 animate-ping opacity-60" style={{ animationDuration: "3s" }} />
            <div className="absolute inset-4 rounded-full border border-violet-500/15 animate-ping opacity-45" style={{ animationDuration: "3s", animationDelay: "0.5s" }} />
            <div className="absolute inset-8 rounded-full border border-violet-500/20 animate-ping opacity-30" style={{ animationDuration: "3s", animationDelay: "1s" }} />
            
            {/* Center glowing orb button */}
            <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-violet-500/10 via-violet-600/5 to-indigo-600/10 border-2 border-violet-500/35 flex items-center justify-center group-hover:scale-105 group-hover:border-violet-400/50 group-hover:shadow-[0_0_25px_rgba(139,92,246,0.25)] transition-all duration-300 shadow-2xl shadow-violet-500/10">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-400 group-hover:text-violet-300 transition-colors duration-300">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
          </div>
        </Link>
        <div className="text-center">
          <p className="text-lg font-extrabold text-white tracking-tight">Receive Payment</p>
          <p className="text-xs text-gray-500 mt-0.5">Click to request via student NFC card</p>
        </div>
      </div>

    </div>
  );
}
