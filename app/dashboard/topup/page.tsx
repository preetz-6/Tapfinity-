"use client";

import { useState } from "react";
import UserShell from "../UserShell";

export default function TopupPage() {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <UserShell>
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-lg">+</div>
          <div>
            <h1 className="text-xl font-bold text-white">Top-up Wallet</h1>
            <p className="text-xs text-gray-500">Add balance via UPI</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#0d0a07] p-6 space-y-5">
          {/* Amount selector */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Select Amount</p>
            <div className="grid grid-cols-3 gap-3">
              {[100, 200, 500, 1000, 2000, 5000].map(a => (
                <button key={a} onClick={() => setSelected(a)}
                  className={`py-3 rounded-xl text-sm font-semibold border transition active:scale-95 ${selected === a ? "bg-orange-500/20 border-orange-500/30 text-orange-300" : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white"}`}>
                  ₹{a.toLocaleString("en-IN")}
                </button>
              ))}
            </div>
          </div>

          {/* Selected display */}
          {selected && (
            <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-gray-400">Selected</span>
              <span className="text-lg font-bold text-orange-400">₹{selected.toLocaleString("en-IN")}</span>
            </div>
          )}

          {/* Coming soon */}
          <div className="rounded-xl bg-white/3 border border-white/5 p-4 text-center space-y-2">
            <span className="text-2xl">🚧</span>
            <p className="text-sm font-semibold text-white">UPI Top-up Coming Soon</p>
            <p className="text-xs text-gray-500">Razorpay integration is being set up. Ask your admin to top-up your wallet for now.</p>
          </div>

          <button disabled
            className="w-full rounded-xl bg-orange-600/20 border border-orange-500/20 text-orange-400/50 font-semibold py-3.5 text-sm cursor-not-allowed">
            Pay via UPI (Coming Soon)
          </button>
        </div>
      </div>
    </UserShell>
  );
}
