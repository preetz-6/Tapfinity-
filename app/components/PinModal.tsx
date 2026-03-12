"use client";

import { useState, useEffect, useRef } from "react";

export default function PinModal({ open, onClose, onSubmit, loading = false, error = "" }: {
  open: boolean; onClose: () => void; onSubmit: (pin: string) => void; loading?: boolean; error?: string;
}) {
  const [pin, setPin] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) { document.body.style.overflow = ""; return; }
    document.body.style.overflow = "hidden";
    setTimeout(() => inputRef.current?.focus(), 100);
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  function handleClose() { setPin(""); onClose(); }
  function handleSubmit() { onSubmit(pin); setPin(""); }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl bg-[#0b1226] border border-white/10 shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-white/5 text-center">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white">Admin PIN</h2>
          <p className="text-sm text-gray-500 mt-0.5">Enter your 6-digit PIN to continue</p>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex justify-center gap-3 mb-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full border-2 transition-all duration-200 ${
                i < pin.length ? "bg-blue-500 border-blue-500 scale-110" : "bg-transparent border-white/20"
              }`} />
            ))}
          </div>

          <input ref={inputRef} type="password" inputMode="numeric" maxLength={6} value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="••••••"
            className="w-full rounded-xl bg-black/40 border border-white/10 p-3 text-center tracking-[0.4em] text-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30 transition" />

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5">
              <span className="text-red-400 text-xs font-bold">✕</span>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={handleClose} disabled={loading}
              className="flex-1 rounded-xl border border-white/10 py-3 text-sm text-gray-400 hover:bg-white/5 hover:text-white transition disabled:opacity-40">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={loading || pin.length !== 6}
              className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-500 py-3 text-sm text-white font-semibold transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Verifying...
                </span>
              ) : "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
