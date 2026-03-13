"use client";

import { useState } from "react";
import PinModal from "@/app/components/PinModal";

export default function TopUpModal({ open, userId, onClose, onSuccess }: { open: boolean; userId: string; onClose: () => void; onSuccess: () => void }) {
  const [amount, setAmount] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

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

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl bg-[#080f20] border border-white/10 overflow-hidden shadow-2xl">
          <div className="px-6 pt-6 pb-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-400">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Top-up Wallet</h2>
                <p className="text-xs text-gray-500">Add balance to user account</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-600 hover:text-white text-xl leading-none">×</button>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-2">Quick amounts</p>
              <div className="grid grid-cols-4 gap-2">
                {[100, 200, 500, 1000].map(a => (
                  <button key={a} onClick={() => setAmount(String(a))}
                    className={`py-2 rounded-xl text-sm font-semibold transition ${amount === String(a) ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300" : "bg-white/5 border border-white/5 text-gray-400 hover:bg-white/10 hover:text-white"}`}>
                    ₹{a}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium mb-2">Custom</p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">₹</span>
                <input type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition" />
              </div>
            </div>
            {error && <div className="rounded-xl bg-red-500/8 border border-red-500/20 px-4 py-2.5 text-sm text-red-400">{error}</div>}
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
