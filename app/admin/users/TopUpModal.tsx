"use client";

import { useState } from "react";
import PinModal from "@/app/components/PinModal";

export default function TopUpModal({ open, userId, onClose, onSuccess }: { open: boolean; userId: string; onClose: () => void; onSuccess: () => void; }) {
  const [amount, setAmount] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function submit(pin: string) {
    setLoading(true); setError("");
    const res = await fetch("/api/admin/users", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, amount: Number(amount), pin, action: "TOP_UP" }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Top-up failed"); return; }
    setPinOpen(false); onClose(); onSuccess(); setAmount("");
  }

  const QUICK = [100, 200, 500, 1000];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl bg-[#080f20] border border-white/10 overflow-hidden animate-fade-up shadow-2xl">
          <div className="px-6 pt-6 pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-lg">💰</div>
              <div>
                <h2 className="text-lg font-bold text-white">Top-up Wallet</h2>
                <p className="text-xs text-gray-500">Add balance to user account</p>
              </div>
            </div>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Quick amounts</p>
              <div className="grid grid-cols-4 gap-2">
                {QUICK.map(a => (
                  <button key={a} onClick={() => setAmount(String(a))}
                    className={`py-2 rounded-xl text-sm font-semibold transition ${amount === String(a) ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300" : "bg-white/5 border border-white/5 text-gray-400 hover:bg-white/10 hover:text-white"}`}>
                    ₹{a}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Custom</p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">₹</span>
                <input type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/30 transition" />
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5">
                <span className="text-red-400 text-xs font-bold">✕</span>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 rounded-xl border border-white/10 py-3 text-sm text-gray-400 hover:bg-white/5 hover:text-white transition">Cancel</button>
              <button onClick={() => setPinOpen(true)} disabled={!amount || Number(amount) <= 0}
                className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
                Top-up ₹{amount || "0"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <PinModal open={pinOpen} loading={loading} error={error} onClose={() => setPinOpen(false)} onSubmit={submit} />
    </>
  );
}
