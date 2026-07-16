"use client";

import { useState, useEffect, useRef } from "react";

interface PinModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (pin: string) => void;
  loading?: boolean;
  error?: string;
  theme?: "blue" | "amber";
}

export default function PinModal({
  open,
  onClose,
  onSubmit,
  loading = false,
  error = "",
  theme = "blue",
}: PinModalProps) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus when modal opens
  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => {
      document.body.style.overflow = "";
      clearTimeout(t);
    };
  }, [open]);

  // Shake effect on error
  useEffect(() => {
    if (error) {
      setShake(true);
      const t = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(t);
    }
  }, [error]);

  if (!open) return null;

  function handleClose() {
    setPin("");
    onClose();
  }

  function handleSubmit() {
    if (pin.length === 6 && !loading) {
      onSubmit(pin);
      setPin("");
    }
  }

  const displayPin = pin.padEnd(6, " ");
  const activeColor = theme === "amber" ? "border-amber-500 text-amber-400 bg-amber-500/5 shadow-amber-500/10" : "border-blue-500 text-blue-400 bg-blue-500/5 shadow-blue-500/10";
  const ringColor = theme === "amber" ? "focus-within:ring-amber-500/40" : "focus-within:ring-blue-500/40";
  const btnColor = theme === "amber" ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/20" : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20";
  const iconBg = theme === "amber" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-blue-500/10 border-blue-500/20 text-blue-400";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 transition-all duration-300">
      {/* Self-contained Shake CSS Animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pin-shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: pin-shake 0.4s ease-in-out;
        }
      `}} />

      <div 
        onClick={handleClose} 
        className="absolute inset-0 cursor-default" 
      />

      <div className={`w-full max-w-sm rounded-[2rem] bg-[#0c0f1a]/95 border border-white/10 shadow-2xl overflow-hidden relative z-10 transition-all duration-300 scale-100 ${shake ? "animate-shake" : ""}`}>
        {/* Header */}
        <div className="px-6 pt-6 pb-2 text-center">
          <div className={`w-12 h-12 rounded-2xl ${iconBg} border flex items-center justify-center mx-auto mb-3.5 shadow-lg`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">Enter Secret PIN</h2>
          <p className="text-xs text-gray-500 mt-1 max-w-[240px] mx-auto">Please enter your secure 6-digit confirmation PIN to continue</p>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Visual Bullet Slots Container */}
          <div 
            className={`relative flex justify-between gap-2.5 max-w-[280px] mx-auto py-1.5 px-2 rounded-2xl bg-black/40 border border-white/5 ${ringColor} transition-all duration-150`}
          >
            {/* Transparent native input overlay for mobile keyboard & desktop input */}
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              disabled={loading}
              className="absolute inset-0 opacity-0 w-full h-full cursor-text z-10 focus:outline-none"
              autoComplete="one-time-code"
            />

            {Array.from({ length: 6 }).map((_, i) => {
              const char = displayPin[i];
              const isActive = i === pin.length;
              const isFilled = char !== " ";
              return (
                <div
                  key={i}
                  className={`w-9 h-11 rounded-xl flex items-center justify-center text-lg font-bold transition-all border duration-200 relative z-0 ${
                    isActive
                      ? `${activeColor} border-2 scale-105`
                      : isFilled
                      ? "border-white/15 bg-white/5 text-white"
                      : "border-white/5 bg-transparent text-gray-700"
                  }`}
                >
                  {isFilled ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-current animate-in fade-in zoom-in duration-150" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <svg className="text-red-400 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-red-400 text-xs font-semibold leading-snug">{error}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2.5 pt-1 border-t border-white/5">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 rounded-xl border border-white/10 py-3 text-xs text-gray-400 font-semibold hover:bg-white/5 hover:text-white transition disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || pin.length !== 6}
              className={`flex-1 rounded-xl ${btnColor} py-3 text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-current" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Verifying
                </>
              ) : (
                "Confirm"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
