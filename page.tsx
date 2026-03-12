"use client";

import { useEffect, useState } from "react";
import UserShell from "../UserShell";
import { useToast } from "@/app/components/Toast";

const QUICK_LIMITS = [100, 200, 500, 1000, 2000];

export default function CardPage() {
  const { toast } = useToast();
  const [status, setStatus] = useState<"ACTIVE" | "BLOCKED">("ACTIVE");
  const [hasCard, setHasCard] = useState(false);
  const [loadingCard, setLoadingCard] = useState(true);
  const [blocking, setBlocking] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);

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
      setHasCard(me.hasCard ?? !!me.cardSecretHash);
      setLoadingCard(false);
      setCurrentLimit(settings.dailySpendingLimit);
      if (settings.dailySpendingLimit) setInputLimit(String(settings.dailySpendingLimit));
    });
  }, []);

  async function blockCard() {
    setBlocking(true);
    const res = await fetch("/api/user/block-card", { method: "POST" });
    setBlocking(false);
    if (res.ok) { toast(status === "BLOCKED" ? "Card unblocked successfully." : "Card blocked successfully.", "success"); setStatus(s => s === "BLOCKED" ? "ACTIVE" : "BLOCKED"); setConfirmBlock(false); }
    else { toast("Failed to update card status.", "error"); }
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

        <div>
          <h1 className="text-xl font-bold text-white">Card & Security</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage your NFC card and spending controls</p>
        </div>

        {loadingCard ? (
          <div className="space-y-4">
            <div className="skeleton h-36 rounded-2xl" />
            <div className="skeleton h-48 rounded-2xl" />
          </div>
        ) : (
          <>
            {/* Card visual */}
            <div className={`rounded-2xl p-6 border relative overflow-hidden ${
              status === "ACTIVE"
                ? "bg-[#0d0a07] border-orange-500/20"
                : "bg-[#0d0608] border-red-500/20"
            }`}>
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Tapfinity</p>
                  <p className="text-sm font-semibold text-white mt-0.5">NFC Campus Card</p>
                </div>
                <div className="w-9 h-9 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                    <path d="M8 12c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4-4-1.79-4-4z"/>
                  </svg>
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${
                    status === "ACTIVE" ? "text-emerald-400" : "text-red-400"
                  }`}>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      status === "ACTIVE" ? "bg-emerald-400 animate-pulse" : "bg-red-400"
                    }`} />
                    {status === "ACTIVE" ? "Active" : "Blocked"}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">Card</p>
                  <span className={`text-sm font-semibold ${hasCard ? "text-white" : "text-gray-600"}`}>
                    {hasCard ? "Provisioned" : "Not linked"}
                  </span>
                </div>
              </div>
            </div>

            {/* Not provisioned warning */}
            {!hasCard && (
              <div className="rounded-xl bg-amber-500/8 border border-amber-500/15 px-4 py-3 flex items-start gap-3">
                <span className="text-amber-400 text-sm mt-0.5">!</span>
                <p className="text-sm text-amber-300/80">No NFC card linked yet. Contact your admin to get a card provisioned.</p>
              </div>
            )}

            {/* Block card section */}
            {hasCard && status === "ACTIVE" && (
              <div className="rounded-2xl border border-white/8 bg-[#080f20] p-5 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-white">Block card</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Immediately stops all NFC payments. Use this if your card is lost or stolen. Only an admin can re-enable it.
                  </p>
                </div>

                {!confirmBlock ? (
                  <button onClick={() => setConfirmBlock(true)}
                    className="w-full rounded-xl border border-red-500/25 bg-red-500/8 text-red-400 font-semibold py-2.5 text-sm hover:bg-red-500/15 transition active:scale-95">
                    Block My Card
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-red-400 font-medium">Are you sure? This cannot be undone by you.</p>
                    <div className="flex gap-2">
                      <button onClick={() => setConfirmBlock(false)}
                        className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-gray-400 hover:bg-white/5 transition">
                        Cancel
                      </button>
                      <button onClick={blockCard} disabled={blocking}
                        className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 py-2.5 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-50">
                        {blocking ? "Blocking..." : "Confirm Block"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Blocked state */}
            {status === "BLOCKED" && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-400">Card is blocked</p>
                  <p className="text-xs text-gray-500 mt-1">Contact your admin to re-enable your card.</p>
                </div>
              </div>
            )}

            {/* Daily spending limit */}
            <div className="rounded-2xl border border-white/8 bg-[#080f20] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Daily Spending Limit</p>
                  <p className="text-xs text-gray-500 mt-0.5">Payments over this cap will be declined</p>
                </div>
                {currentLimit ? (
                  <span className="text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-full px-2.5 py-0.5">
                    ₹{currentLimit.toLocaleString("en-IN")}/day
                  </span>
                ) : (
                  <span className="text-xs text-gray-600 border border-white/5 rounded-full px-2.5 py-0.5">No limit</span>
                )}
              </div>

              <div className="grid grid-cols-5 gap-2">
                {QUICK_LIMITS.map(l => (
                  <button key={l} onClick={() => setInputLimit(String(l))}
                    className={`py-2 rounded-lg text-xs font-semibold border transition ${
                      inputLimit === String(l)
                        ? "bg-orange-500/15 border-orange-500/25 text-orange-300"
                        : "bg-white/3 border-white/8 text-gray-500 hover:text-white hover:bg-white/8"
                    }`}>
                    ₹{l}
                  </button>
                ))}
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                <input type="number" placeholder="Custom amount" value={inputLimit}
                  onChange={e => setInputLimit(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 transition placeholder-gray-700" />
              </div>

              <div className="flex gap-2">
                <button onClick={() => saveLimit(inputLimit ? Number(inputLimit) : null)} disabled={limitLoading}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition active:scale-95 disabled:opacity-50 ${
                    limitSaved
                      ? "bg-emerald-500/15 border border-emerald-500/25 text-emerald-400"
                      : "bg-orange-600 hover:bg-orange-500 text-white"
                  }`}>
                  {limitLoading ? "Saving..." : limitSaved ? "Saved" : "Set Limit"}
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
