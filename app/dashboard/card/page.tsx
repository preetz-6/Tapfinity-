"use client";

import { useEffect, useState } from "react";
import UserShell from "../UserShell";

const QUICK_LIMITS = [100, 200, 500, 1000, 2000];

export default function CardPage() {
  const [status, setStatus] = useState<"ACTIVE" | "BLOCKED">("ACTIVE");
  const [hasCard, setHasCard] = useState(false);
  const [loadingCard, setLoadingCard] = useState(true);
  const [blocking, setBlocking] = useState(false);
  const [blocked, setBlocked] = useState(false);

  // Spending limit state
  const [currentLimit, setCurrentLimit] = useState<number | null>(null);
  const [inputLimit, setInputLimit] = useState("");
  const [limitLoading, setLimitLoading] = useState(false);
  const [limitSaved, setLimitSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/user/me").then(r => r.json()),
      fetch("/api/user/settings").then(r => r.json()),
    ]).then(([me, settings]) => {
      setStatus(me.status);
      setHasCard(!!me.cardSecretHash);
      setLoadingCard(false);
      setCurrentLimit(settings.dailySpendingLimit);
      if (settings.dailySpendingLimit) setInputLimit(String(settings.dailySpendingLimit));
    });
  }, []);

  async function blockCard() {
    setBlocking(true);
    const res = await fetch("/api/user/block-card", { method: "POST" });
    setBlocking(false);
    if (res.ok) { setStatus("BLOCKED"); setBlocked(true); }
    else alert("Failed to block card.");
  }

  async function saveLimit(value: number | null) {
    setLimitLoading(true);
    const res = await fetch("/api/user/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dailySpendingLimit: value }),
    });
    const data = await res.json();
    setLimitLoading(false);
    if (data.ok) {
      setCurrentLimit(data.dailySpendingLimit);
      setLimitSaved(true);
      setTimeout(() => setLimitSaved(false), 2000);
    }
  }

  return (
    <UserShell>
      <div className="max-w-md mx-auto space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-lg">▣</div>
          <div>
            <h1 className="text-xl font-bold text-white">Card & Security</h1>
            <p className="text-xs text-gray-500">Manage your NFC card and spending controls</p>
          </div>
        </div>

        {loadingCard ? (
          <div className="space-y-4">
            <div className="skeleton h-36 rounded-2xl" />
            <div className="skeleton h-48 rounded-2xl" />
          </div>
        ) : (
          <>
            {/* Card Visual */}
            <div className={`rounded-2xl p-6 border relative overflow-hidden ${status === "ACTIVE" ? "bg-gradient-to-br from-orange-500/10 to-amber-600/5 border-orange-500/20" : "bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20"}`}>
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Tapfinity</p>
                  <p className="text-sm font-semibold text-white mt-0.5">NFC Campus Card</p>
                </div>
                <span className="text-2xl">📳</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${status === "ACTIVE" ? "text-emerald-400" : "text-red-400"}`}>
                    <span className={`w-2 h-2 rounded-full ${status === "ACTIVE" ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                    {status === "ACTIVE" ? "Active" : "Blocked"}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">Provisioned</p>
                  <span className={`text-sm font-semibold ${hasCard ? "text-white" : "text-gray-500"}`}>{hasCard ? "Yes ✓" : "Not yet"}</span>
                </div>
              </div>
            </div>

            {/* Not provisioned warning */}
            {!hasCard && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 flex items-start gap-3">
                <span className="text-amber-400 text-sm mt-0.5">⚠</span>
                <p className="text-sm text-amber-300">No card provisioned yet. Contact admin to set up your NFC card.</p>
              </div>
            )}

            {/* Block section - only show if active */}
            {status === "ACTIVE" && hasCard && !blocked && (
              <div className="rounded-2xl border border-white/8 bg-[#0d0a07] p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-red-400">🔒</span>
                  <p className="text-sm font-semibold text-white">Block card</p>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Instantly prevents all NFC payments. Only an admin can re-enable your card — you cannot unblock it yourself.
                </p>
                <button onClick={blockCard} disabled={blocking}
                  className="w-full rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 font-semibold py-3 text-sm transition active:scale-95 disabled:opacity-50">
                  {blocking ? "Blocking…" : "Block My Card"}
                </button>
              </div>
            )}

            {/* Blocked state */}
            {(status === "BLOCKED" || blocked) && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 flex items-start gap-3">
                <span className="text-red-400 text-lg">🔒</span>
                <div>
                  <p className="text-sm font-semibold text-red-400">Card is blocked</p>
                  <p className="text-xs text-gray-500 mt-1">Contact your admin to re-enable your card and resume payments.</p>
                </div>
              </div>
            )}

            {/* ── DAILY SPENDING LIMIT ── */}
            <div className="rounded-2xl border border-white/8 bg-[#0d0a07] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>💰</span>
                  <p className="text-sm font-semibold text-white">Daily Spending Limit</p>
                </div>
                {currentLimit ? (
                  <span className="text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-full px-2.5 py-0.5">
                    ₹{currentLimit.toLocaleString("en-IN")}/day
                  </span>
                ) : (
                  <span className="text-xs text-gray-600 bg-white/3 border border-white/5 rounded-full px-2.5 py-0.5">No limit set</span>
                )}
              </div>

              <p className="text-xs text-gray-500 leading-relaxed">
                Set a daily cap on how much can be charged to your card. Payments that exceed this limit will be declined automatically.
              </p>

              {/* Quick presets */}
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Quick set</p>
                <div className="grid grid-cols-5 gap-2">
                  {QUICK_LIMITS.map(l => (
                    <button key={l} onClick={() => { setInputLimit(String(l)); }}
                      className={`py-2 rounded-lg text-xs font-semibold border transition ${inputLimit === String(l) ? "bg-orange-500/20 border-orange-500/30 text-orange-300" : "bg-white/3 border-white/8 text-gray-500 hover:text-white hover:bg-white/8"}`}>
                      ₹{l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom input */}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₹</span>
                <input type="number" placeholder="Custom amount" value={inputLimit}
                  onChange={e => setInputLimit(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition placeholder-gray-700" />
              </div>

              <div className="flex gap-2">
                <button onClick={() => saveLimit(inputLimit ? Number(inputLimit) : null)} disabled={limitLoading}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition active:scale-95 disabled:opacity-50 ${limitSaved ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400" : "bg-orange-600 hover:bg-orange-500 text-white"}`}>
                  {limitLoading ? "Saving…" : limitSaved ? "✓ Saved!" : "Set Limit"}
                </button>
                {currentLimit && (
                  <button onClick={() => { saveLimit(null); setInputLimit(""); }}
                    className="px-4 py-2.5 rounded-xl border border-white/10 text-gray-500 text-sm hover:text-red-400 hover:border-red-500/20 transition">
                    Remove
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </UserShell>
  );
}
